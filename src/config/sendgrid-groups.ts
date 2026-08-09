// src/config/sendgrid-groups.ts
//
// SendGrid unsubscribe (ASM) group IDs. These are NOT secrets — they appear in
// the unsubscribe URL of every email that uses them — so they live in config
// where they are reviewable, rather than in environment variables.
//
// Separate groups exist so leaving one stream does not silently remove someone
// from the others. A partner who no longer wants a class every day should not
// also lose the partner material they are paying for.
//
// ⚠️ Two things must line up for an unsubscribe link to work, and neither is
// sufficient alone:
//   1. The send passes `asm: { group_id }`  (see lib/email/sendgrid.ts)
//   2. The SendGrid template contains the link tag, e.g.
//        <a href="<%asm_group_unsubscribe_raw_url%>">Unsubscribe</a>
// Pass the id without the tag and no link renders; add the tag without the id
// and the recipient sees the raw `<%asm_...%>` string.

export const SENDGRID_UNSUBSCRIBE_GROUPS = {
    /** The 90-day class sequence. What the drip sends. */
    classes: 60450,
    /** Updates and extra material for monthly partners. */
    partner: 60451,
    /** Occasional ministry news, outside the class sequence. */
    announcements: 60452,
} as const;

export type SendGridGroup = keyof typeof SENDGRID_UNSUBSCRIBE_GROUPS;
