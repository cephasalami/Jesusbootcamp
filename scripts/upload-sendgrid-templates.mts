// Upload the class drip emails in emails/classes/ to SendGrid as dynamic
// templates, and print the `d-…` ids to paste into the manifest Sheet.
//
// The HTML in emails/classes/ is the SOURCE OF TRUTH. Re-running this adds a new
// ACTIVE VERSION to the existing template rather than creating a duplicate, so
// editing the file and re-running is the correct way to change an email. The
// corollary: edits made in SendGrid's UI are silently overwritten by the next
// run. Edit the files.
//
// Needs a SEPARATE key from SENDGRID_API_KEY. The send key is deliberately
// restricted to mail.send — the drip must not be able to rewrite its own
// templates. Create a second restricted key with:
//     Template Engine: Full Access   (templates.create / .read / .update
//                                     and templates.versions.create / .update)
// then delete it once the templates are loaded.
//
//   set SENDGRID_TEMPLATE_API_KEY in .env.local (it is gitignored)
//
//   node --env-file=.env.local scripts/upload-sendgrid-templates.mts
//   node --env-file=.env.local scripts/upload-sendgrid-templates.mts --apply
//   node --env-file=.env.local scripts/upload-sendgrid-templates.mts --apply --only 1
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const apply = process.argv.includes("--apply");
const onlyIdx = process.argv.indexOf("--only");
const only = onlyIdx >= 0 ? process.argv[onlyIdx + 1] : null;

const API_KEY = process.env.SENDGRID_TEMPLATE_API_KEY;
if (!API_KEY) {
    throw new Error(
        "SENDGRID_TEMPLATE_API_KEY is not set. Create a SECOND restricted key with " +
            "Template Engine access — do not reuse SENDGRID_API_KEY, which is send-only by design."
    );
}

const here = dirname(fileURLToPath(import.meta.url));
const emailsDir = join(here, "..", "emails");

type Entry = {
    /** Class slug, for templates that map to a class in the manifest Sheet. */
    slug?: string;
    file: string;
    name: string;
    subject: string;
    /** Env var the id belongs in, for templates with no class slug. */
    env?: string;
    /** Transactional mail carries no unsubscribe tag — see the checks below. */
    transactional?: boolean;
};
const index = JSON.parse(await readFile(join(emailsDir, "index.json"), "utf8")) as {
    templates: Entry[];
};
const entries = only ? index.templates.filter((t) => t.slug === only) : index.templates;
if (entries.length === 0) throw new Error(only ? `No template with slug "${only}"` : "No templates listed");

const headers = { Authorization: `Bearer ${API_KEY}`, "Content-Type": "application/json" };

async function sg<T>(path: string, init?: RequestInit): Promise<{ status: number; body: T }> {
    let lastError: unknown;
    for (let attempt = 1; attempt <= 4; attempt++) {
        try {
            const res = await fetch(`https://api.sendgrid.com/v3${path}`, {
                ...init,
                headers,
                signal: AbortSignal.timeout(30_000),
            });
            const text = await res.text();
            let body: unknown = null;
            try {
                body = text ? JSON.parse(text) : null;
            } catch {
                body = text;
            }
            // 4xx will not fix itself; only retry transport and 5xx.
            if (res.status < 500) return { status: res.status, body: body as T };
            lastError = new Error(`HTTP ${res.status}`);
        } catch (error) {
            lastError = error;
        }
        if (attempt < 4) await new Promise((r) => setTimeout(r, attempt * 800));
    }
    throw lastError;
}

/**
 * Every dynamic template already on the account, by name. This is what makes
 * re-running safe: a name we already know gets a NEW VERSION rather than a
 * second template with the same name.
 *
 * ⚠️ The list lives under `result`, NOT `templates`. Reading the wrong key
 * yields an empty map, every template then looks new, and --apply silently
 * creates duplicates — while the ids already pasted into the manifest keep
 * pointing at the originals, so edits appear to do nothing. Failing that way
 * is invisible until someone wonders why a fix never reached recipients.
 */
async function existingByName(): Promise<Map<string, string>> {
    const found = new Map<string, string>();
    let url = "/templates?generations=dynamic&page_size=200";
    for (;;) {
        const { status, body } = await sg<{
            result?: Array<{ id: string; name: string }>;
            _metadata?: { next?: string };
        }>(url);
        if (status === 403) {
            throw new Error(
                "403 from /v3/templates — this key lacks Template Engine access. " +
                    "SENDGRID_TEMPLATE_API_KEY must be a key with template permissions, not the send-only key."
            );
        }
        if (status >= 400) throw new Error(`Listing templates failed (${status})`);

        const page = body.result;
        if (!Array.isArray(page)) {
            throw new Error(
                "Unexpected /v3/templates response: no `result` array. Refusing to continue, " +
                    "because treating this as 'no templates exist' would create duplicates."
            );
        }
        for (const t of page) found.set(t.name, t.id);

        const next = body._metadata?.next;
        if (!next) break;
        url = next.replace("https://api.sendgrid.com/v3", "");
    }
    return found;
}

const existing = await existingByName();
console.log(apply ? "APPLYING" : "AUDIT ONLY — re-run with --apply to upload");
console.log(`${existing.size} dynamic template(s) already on the account\n`);

const results: Array<{ slug: string | null; env: string | null; id: string; action: string }> = [];

for (const entry of entries) {
    const html = await readFile(join(emailsDir, entry.file), "utf8");

    // Catch a half-converted file before it reaches real recipients: a stray
    // Mailchimp tag renders as literal text, and a missing {{class_url}} means
    // the CTA points nowhere.
    const problems: string[] = [];
    const label = entry.slug ?? "txn";

    // A leftover Mailchimp tag renders as literal text to a real recipient.
    if (/\*\|[A-Z_:]+\|\*/.test(html)) problems.push("still contains Mailchimp merge tags");

    if (entry.transactional) {
        // Fulfilment mail must NOT carry a marketing unsubscribe: a newsletter
        // opt-out would then suppress delivery of something already paid for.
        if (html.includes("<%asm_group_unsubscribe_raw_url%>")) {
            problems.push("transactional template must not carry a marketing unsubscribe tag");
        }
    } else {
        if (!html.includes("{{class_url}}")) problems.push("missing {{class_url}} on the CTA");
        if (!html.includes("<%asm_group_unsubscribe_raw_url%>")) problems.push("missing the unsubscribe tag");
    }

    if (problems.length) {
        console.log(`  ! ${label}  SKIPPED — ${problems.join("; ")}`);
        continue;
    }

    let templateId = existing.get(entry.name) ?? null;
    const action = templateId ? "new version" : "create";

    if (!apply) {
        console.log(`  · ${label.padEnd(4)} ${action.padEnd(11)} ${entry.name}`);
        continue;
    }

    if (!templateId) {
        const { status, body } = await sg<{ id?: string }>("/templates", {
            method: "POST",
            body: JSON.stringify({ name: entry.name, generation: "dynamic" }),
        });
        if (status >= 400 || !body.id) throw new Error(`Creating "${entry.name}" failed (${status})`);
        templateId = body.id;
    }

    const { status, body } = await sg<{ id?: string; error?: string }>(`/templates/${templateId}/versions`, {
        method: "POST",
        body: JSON.stringify({
            template_id: templateId,
            // Activating immediately is what makes the id usable straight away;
            // an inactive version would leave sends rendering the previous one.
            active: 1,
            name: `${entry.name} — ${new Date().toISOString().slice(0, 16).replace("T", " ")}`,
            subject: entry.subject,
            html_content: html,
        }),
    });
    if (status >= 400) throw new Error(`Uploading version for "${entry.name}" failed (${status}): ${JSON.stringify(body).slice(0, 200)}`);

    results.push({ slug: entry.slug ?? null, env: entry.env ?? null, id: templateId, action });
    console.log(`  + ${label.padEnd(4)} ${action.padEnd(11)} ${templateId}  ${entry.name}`);
}

if (apply && results.length > 0) {
    const classes = results.filter((r) => r.slug);
    const envs = results.filter((r) => r.env);

    if (classes.length > 0) {
        console.log("\nPaste into the manifest Sheet's `sendgrid_template_id` column:\n");
        console.log("  class slug   sendgrid_template_id");
        for (const r of classes) console.log(`  ${(r.slug ?? "").padEnd(12)} ${r.id}`);
        console.log(
            "\nThen set CLASS_MANIFEST_RANGE=A1:L200 in Vercel and redeploy, or the\n" +
                "column exists in the Sheet but Google never returns it."
        );
    }

    if (envs.length > 0) {
        // Transactional templates are not tied to a class, so they are wired up
        // by environment variable rather than through the manifest.
        console.log("\nSet in Vercel (and .env.local for local testing):\n");
        for (const r of envs) console.log(`  ${r.env}=${r.id}`);
    }
}
