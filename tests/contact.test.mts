import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
    contactNotificationText,
    deliverContactEmail,
    deliverContactNotification,
    validateContactMessage,
} from "../src/lib/contact.ts";

describe("contact form validation", () => {
    test("accepts and normalises a valid class help request", () => {
        const result = validateContactMessage({
            name: "  Jane Doe  ",
            email: "  JANE@example.com ",
            message: "  My partner podcast is still locked.  ",
            classSlug: "4a",
        });

        assert.equal(result.ok, true);
        if (result.ok) {
            assert.deepEqual(result.value, {
                name: "Jane Doe",
                email: "jane@example.com",
                message: "My partner podcast is still locked.",
                classSlug: "4a",
            });
        }
    });

    test("rejects malformed input", () => {
        assert.deepEqual(
            validateContactMessage({ name: "J", email: "not-an-email", message: "short" }),
            { ok: false, error: "Please enter your name." }
        );
    });

    test("formats a plain-text notification with the class reference", () => {
        const text = contactNotificationText({
            name: "Jane Doe",
            email: "jane@example.com",
            message: "My partner podcast is still locked.",
            classSlug: "4a",
        });

        assert.match(text, /Class: 4A/);
        assert.match(text, /jane@example\.com/);
        assert.match(text, /My partner podcast is still locked\./);
    });

    test("posts a Slack-compatible notification to the configured webhook", async () => {
        let sentUrl = "";
        let sentBody = "";
        const fakeFetch: typeof fetch = async (input, init) => {
            sentUrl = String(input);
            sentBody = String(init?.body);
            return new Response('{"ok":true}', { status: 200 });
        };

        await deliverContactNotification(
            "https://hooks.example.test/contact",
            {
                name: "Jane Doe",
                email: "jane@example.com",
                message: "My partner podcast is still locked.",
                classSlug: "4a",
            },
            fakeFetch
        );

        assert.equal(sentUrl, "https://hooks.example.test/contact");
        assert.match(sentBody, /New Jesus Boot Camp contact message/);
        assert.match(sentBody, /Class: 4A/);
    });

    test("does not report success when the notification endpoint rejects it", async () => {
        const failingFetch: typeof fetch = async () => new Response("no", { status: 500 });
        await assert.rejects(
            deliverContactNotification(
                "https://hooks.example.test/contact",
                {
                    name: "Jane Doe",
                    email: "jane@example.com",
                    message: "My partner podcast is still locked.",
                    classSlug: "4a",
                },
                failingFetch
            ),
            /returned 500/
        );
    });

    test("sends a reply-ready notification through Mailchimp Transactional", async () => {
        let requestBody = {} as Record<string, unknown>;
        const fakeFetch: typeof fetch = async (_input, init) => {
            requestBody = JSON.parse(String(init?.body)) as Record<string, unknown>;
            return new Response(
                JSON.stringify([
                    { email: "Team@Jesusbootcamp.org", status: "queued", _id: "abc123" },
                    { email: "Mail.jesusbootcamp@gmail.com", status: "sent", _id: "def456" },
                    { email: "pauljoseph0205@gmail.com", status: "queued", _id: "ghi789" },
                ]),
                { status: 200 }
            );
        };

        const result = await deliverContactEmail(
            "test-api-key",
            [
                "Team@Jesusbootcamp.org",
                "Mail.jesusbootcamp@gmail.com",
                "pauljoseph0205@gmail.com",
            ],
            "Team@Jesusbootcamp.org",
            {
                name: "Jane Doe",
                email: "jane@example.com",
                message: "My partner podcast is still locked.",
                classSlug: "4a",
            },
            fakeFetch
        );

        assert.deepEqual(result, [
            { email: "Team@Jesusbootcamp.org", status: "queued", id: "abc123" },
            { email: "Mail.jesusbootcamp@gmail.com", status: "sent", id: "def456" },
            { email: "pauljoseph0205@gmail.com", status: "queued", id: "ghi789" },
        ]);
        assert.equal(requestBody.key, "test-api-key");
        const message = requestBody.message as Record<string, unknown>;
        assert.equal(message.from_email, "Team@Jesusbootcamp.org");
        assert.deepEqual(message.headers, { "Reply-To": "jane@example.com" });
        assert.equal(message.subject, "Contact request — Class 4A");
        assert.deepEqual(message.to, [
            { email: "Team@Jesusbootcamp.org", type: "to" },
            { email: "Mail.jesusbootcamp@gmail.com", type: "to" },
            { email: "pauljoseph0205@gmail.com", type: "to" },
        ]);
    });

    test("rejects an invalid Mailchimp send result", async () => {
        const rejectedFetch: typeof fetch = async () =>
            new Response(
                JSON.stringify([
                    {
                        email: "Team@Jesusbootcamp.org",
                        status: "rejected",
                        reject_reason: "unsigned",
                    },
                ]),
                { status: 200 }
            );

        await assert.rejects(
            deliverContactEmail(
                "test-api-key",
                ["Team@Jesusbootcamp.org"],
                "Team@Jesusbootcamp.org",
                {
                    name: "Jane Doe",
                    email: "jane@example.com",
                    message: "My partner podcast is still locked.",
                    classSlug: "4a",
                },
                rejectedFetch
            ),
            /unsigned/
        );
    });
});
