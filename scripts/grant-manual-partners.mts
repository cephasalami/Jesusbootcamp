// Grant existing Mailchimp contacts manual partner access without creating a
// Stripe subscription. Run without --apply first to inspect; --apply performs
// the change. Each target uses: --target="Name|person@example.com".
import {
    activatePartner,
    COURSE_START_FIELD,
    COURSE_START_TAG,
    COURSE_TOKEN_FIELD,
    getMember,
} from "../src/lib/mailchimp.ts";

type Target = { name: string; email: string };

const apply = process.argv.includes("--apply");
const targets: Target[] = process.argv
    .filter((argument) => argument.startsWith("--target="))
    .map((argument) => argument.slice("--target=".length))
    .map((value) => {
        const [name, email] = value.split("|");
        return { name: name?.trim() ?? "", email: email?.trim().toLowerCase() ?? "" };
    });

if (!targets.length || targets.some((target) => !target.name || !/^\S+@\S+\.\S+$/.test(target.email))) {
    throw new Error('Supply at least one target as --target="Name|person@example.com"');
}

function hasValidToken(value: string | undefined): boolean {
    return /^[a-f0-9]{64}$/i.test(String(value ?? "").trim());
}

function hasValidCourseStart(value: string | undefined): boolean {
    const text = String(value ?? "").trim();
    if (!text) return false;
    const parsed = new Date(/^\d{4}-\d{2}-\d{2}$/.test(text) ? `${text}T00:00:00Z` : text);
    return !Number.isNaN(parsed.getTime());
}

async function inspect(target: Target) {
    const member = await getMember(target.email);
    if (!member) {
        return {
            name: target.name,
            email: target.email,
            found: false,
            changed: false,
            partner: false,
            classReady: false,
            reason: "Not found in the Mailchimp audience; no contact was created.",
        };
    }

    const partner = String(member.mergeFields.PARTNER ?? "").trim().toLowerCase() === "true";
    const hasCourseTag = member.tags.includes(COURSE_START_TAG);
    const validToken = hasValidToken(member.mergeFields[COURSE_TOKEN_FIELD]);
    const validCourseStart = hasValidCourseStart(member.mergeFields[COURSE_START_FIELD]);
    return {
        name: target.name,
        email: target.email,
        found: true,
        changed: false,
        partner,
        partnerActiveTag: member.tags.includes("partner-active"),
        partnerCustomTag: member.tags.includes("partner-custom"),
        hasCourseTag,
        validToken,
        validCourseStart,
        classReady: hasCourseTag && validToken && validCourseStart,
        status: member.status,
    };
}

const before = [];
for (const target of targets) before.push(await inspect(target));

console.log(JSON.stringify({ mode: apply ? "apply" : "audit", before }, null, 2));

if (!apply) process.exit(0);

const after = [];
for (const target of targets) {
    const record = before.find((item) => item.email === target.email);
    if (!record?.found) {
        after.push(record);
        continue;
    }
    await activatePartner({ email: target.email, name: target.name, tier: "custom" });
    const verified = await inspect(target);
    after.push({ ...verified, changed: true });
}

console.log(JSON.stringify({ mode: "verification", after }, null, 2));

if (after.some((record) => !record?.found || !record.partner || !record.partnerActiveTag || !record.partnerCustomTag)) {
    process.exitCode = 1;
}
