// src/lib/email/sendgrid.ts — SERVER-ONLY transactional sender.
//
// One class email to one person, via SendGrid's v3 Mail Send API using a
// DYNAMIC TEMPLATE. The content deliberately lives in SendGrid rather than in
// this repo so Paul can edit copy without a deploy — the same reason the class
// manifest lives in a Google Sheet.
//
// Sending one-at-a-time (rather than a batched `personalizations` array) is
// intentional. A per-recipient result is what makes the drip idempotent: we
// only record a class as sent when THAT person's request succeeded, so a
// partial failure retries just the people it missed instead of re-mailing
// everyone who already received it.

const API_KEY = process.env.SENDGRID_API_KEY;
const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || "team@jesusbootcamp.org";
const FROM_NAME = process.env.SENDGRID_FROM_NAME || "Jesus Boot Camp";
/** Optional: SendGrid unsubscribe group, so opt-outs are honoured by SendGrid. */
const UNSUBSCRIBE_GROUP = process.env.SENDGRID_UNSUBSCRIBE_GROUP_ID;

export const isSendGridConfigured = Boolean(API_KEY);

export type SendResult =
    | { ok: true }
    /** `retryable` distinguishes a rate limit or outage from a bad address. */
    | { ok: false; status: number; detail: string; retryable: boolean };

/**
 * Send one dynamic-template email.
 *
 * Never throws — a send failure is data the caller records, not an exception
 * that aborts a run part-way through a list and leaves it half-sent.
 */
export async function sendTemplateEmail(input: {
    to: string;
    templateId: string;
    /** Handlebars values the template renders, e.g. { ctoken, first_name }. */
    data: Record<string, string | number | null>;
    /** Groups sends in SendGrid's UI; use the class slug. */
    category?: string;
}): Promise<SendResult> {
    if (!API_KEY) {
        return { ok: false, status: 0, detail: "SENDGRID_API_KEY is not set", retryable: false };
    }

    try {
        const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                from: { email: FROM_EMAIL, name: FROM_NAME },
                personalizations: [
                    {
                        to: [{ email: input.to }],
                        dynamic_template_data: input.data,
                    },
                ],
                template_id: input.templateId,
                ...(input.category ? { categories: [input.category] } : {}),
                ...(UNSUBSCRIBE_GROUP
                    ? { asm: { group_id: Number(UNSUBSCRIBE_GROUP) } }
                    : {}),
                // Open/click tracking is left to SendGrid's account defaults.
                // Click tracking rewrites every link through a SendGrid domain,
                // which is worth knowing about given the deliverability work:
                // it replaces jesusbootcamp.org links in the recipient's view.
                mail_settings: { bypass_list_management: { enable: false } },
            }),
            signal: AbortSignal.timeout(15_000),
        });

        if (res.status === 202) return { ok: true };

        const detail = (await res.text().catch(() => "")).slice(0, 300);
        return {
            ok: false,
            status: res.status,
            detail: detail || `SendGrid returned ${res.status}`,
            // 429 = rate limited, 5xx = their problem. A 400 means the payload
            // or the address is wrong and will fail identically forever.
            retryable: res.status === 429 || res.status >= 500,
        };
    } catch (error) {
        return {
            ok: false,
            status: 0,
            detail: error instanceof Error ? error.message : "Network error",
            retryable: true,
        };
    }
}
