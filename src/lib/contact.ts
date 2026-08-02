export const CONTACT_EMAIL = "Team@Jesusbootcamp.org";
export const CONTACT_EMAILS = (
    process.env.CONTACT_NOTIFICATION_EMAILS ||
    process.env.CONTACT_NOTIFICATION_EMAIL ||
    CONTACT_EMAIL
)
    .split(",")
    .map((email) => email.trim())
    .filter(Boolean);
export const CONTACT_FROM_EMAIL =
    process.env.CONTACT_FROM_EMAIL?.trim() || "Team@Jesusbootcamp.org";

export type ContactMessage = {
    name: string;
    email: string;
    message: string;
    classSlug: string;
};

type ContactValidation =
    | { ok: true; value: ContactMessage }
    | { ok: false; error: string };

function clean(value: unknown, maxLength: number): string {
    return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

export function validateContactMessage(input: unknown): ContactValidation {
    if (!input || typeof input !== "object") {
        return { ok: false, error: "Please complete the contact form." };
    }

    const body = input as Record<string, unknown>;
    const name = clean(body.name, 100);
    const email = clean(body.email, 254).toLowerCase();
    const message = clean(body.message, 4000);
    const classSlug = clean(body.classSlug, 30);

    if (name.length < 2) {
        return { ok: false, error: "Please enter your name." };
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return { ok: false, error: "Please enter a valid email address." };
    }
    if (message.length < 10) {
        return { ok: false, error: "Please tell us a little more about what happened." };
    }
    if (classSlug && !/^[a-z0-9-]+$/i.test(classSlug)) {
        return { ok: false, error: "The class reference is not valid." };
    }

    return { ok: true, value: { name, email, message, classSlug } };
}

export function contactNotificationText(contact: ContactMessage): string {
    const classLine = contact.classSlug ? `Class: ${contact.classSlug.toUpperCase()}\n` : "";
    return [
        "New Jesus Boot Camp contact message",
        "",
        `Name: ${contact.name}`,
        `Email: ${contact.email}`,
        classLine.trimEnd(),
        "Message:",
        contact.message,
    ]
        .filter(Boolean)
        .join("\n");
}

export async function deliverContactNotification(
    webhookUrl: string,
    contact: ContactMessage,
    fetcher: typeof fetch = fetch
): Promise<void> {
    const response = await fetcher(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: contactNotificationText(contact) }),
        signal: AbortSignal.timeout(8_000),
        cache: "no-store",
    });

    if (!response.ok) {
        throw new Error(`Contact webhook returned ${response.status}`);
    }
}

type TransactionalSendResult = {
    email?: string;
    status?: string;
    _id?: string;
    reject_reason?: string;
    "queued-reason"?: string;
};

export async function deliverContactEmail(
    apiKey: string,
    toEmails: string[],
    fromEmail: string,
    contact: ContactMessage,
    fetcher: typeof fetch = fetch
): Promise<Array<{ email: string; status: "sent" | "queued"; id: string }>> {
    const classLabel = contact.classSlug ? `Class ${contact.classSlug.toUpperCase()}` : "Website";
    const response = await fetcher("https://mandrillapp.com/api/1.0/messages/send.json", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            key: apiKey,
            message: {
                from_email: fromEmail,
                from_name: "Jesus Boot Camp Website",
                subject: `Contact request — ${classLabel}`,
                text: contactNotificationText(contact),
                to: toEmails.map((email) => ({ email, type: "to" })),
                headers: { "Reply-To": contact.email },
                important: true,
                track_opens: false,
                track_clicks: false,
                tags: ["website-contact"],
            },
        }),
        signal: AbortSignal.timeout(10_000),
        cache: "no-store",
    });

    const payload = (await response.json().catch(() => null)) as
        | TransactionalSendResult[]
        | { message?: string; name?: string }
        | null;

    if (!response.ok) {
        const message = payload && !Array.isArray(payload) ? payload.message || payload.name : "";
        throw new Error(`Mailchimp Transactional returned ${response.status}${message ? `: ${message}` : ""}`);
    }

    const results = Array.isArray(payload) ? payload : [];
    if (results.length !== toEmails.length) {
        throw new Error(
            `Mailchimp Transactional returned ${results.length} results for ${toEmails.length} recipients`
        );
    }

    const rejected = results.find(
        (result) => result.status !== "sent" && result.status !== "queued"
    );
    if (rejected) {
        const reason =
            rejected.reject_reason ||
            rejected["queued-reason"] ||
            rejected.status ||
            "unknown response";
        throw new Error(
            `Mailchimp Transactional did not accept the message for ${rejected.email || "a recipient"}: ${reason}`
        );
    }

    return results.map((result, index) => ({
        email: result.email || toEmails[index],
        status: result.status as "sent" | "queued",
        id: result._id || "",
    }));
}
