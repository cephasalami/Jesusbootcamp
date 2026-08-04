import assert from "node:assert/strict";
import { after, before, test } from "node:test";

const originalFetch = globalThis.fetch;
const kv = new Map<string, string>();
let reportRequests = 0;

process.env.MAILCHIMP_API_KEY = "campaign-test-key";
process.env.MAILCHIMP_API_SERVER = "campaign-test";
process.env.MAILCHIMP_AUDIENCE_ID = "campaign-test-audience";
process.env.KV_REST_API_URL = "https://kv.campaign-test";
process.env.KV_REST_API_TOKEN = "campaign-test-token";

function json(body: unknown): Response {
    return new Response(JSON.stringify(body), { headers: { "Content-Type": "application/json" } });
}

before(() => {
    globalThis.fetch = async (input, init) => {
        const url = String(input);
        if (url === "https://kv.campaign-test") {
            const [command, key, value] = JSON.parse(String(init?.body ?? "[]")) as string[];
            if (command === "GET") return json({ result: kv.get(key) ?? null });
            if (command === "SET") {
                kv.set(key, value);
                return json({ result: "OK" });
            }
        }
        if (url.startsWith("https://campaign-test.api.mailchimp.com/3.0/reports?")) {
            reportRequests += 1;
            return json({
                total_items: 2,
                reports: [
                    {
                        id: "older",
                        campaign_title: "Older class email",
                        send_time: "2026-01-01T00:00:00+00:00",
                        emails_sent: 10,
                        opens: { unique_opens: 5, open_rate: 50 },
                        clicks: { unique_clicks: 2, click_rate: 20 },
                    },
                    {
                        id: "newer",
                        subject_line: "Latest class email",
                        send_time: "2026-02-01T00:00:00+00:00",
                        emails_sent: 20,
                        opens: { unique_opens: 14, open_rate: 70 },
                        clicks: { unique_clicks: 4, click_rate: 20 },
                    },
                ],
            });
        }
        return new Response("Not found", { status: 404 });
    };
});

after(() => {
    globalThis.fetch = originalFetch;
});

test("reads sent-campaign opens/clicks from Reports and serves later reads from cache", async () => {
    const { readMailchimpCampaignMetrics } = await import(
        "../src/lib/tracking/mailchimp-campaign-metrics.ts"
    );

    const first = await readMailchimpCampaignMetrics();
    const second = await readMailchimpCampaignMetrics();

    assert.equal(first.error, undefined);
    assert.equal(first.totalCampaigns, 2);
    assert.equal(first.totalOpens, 19);
    assert.equal(first.totalClicks, 6);
    assert.equal(first.campaigns[0].title, "Latest class email");
    assert.equal(first.campaigns[0].opens, 14);
    assert.equal(second.totalOpens, 19);
    assert.equal(reportRequests, 1);
    assert.ok(kv.has("jbc:tracking:mailchimp-campaign-reports:v1"));
});
