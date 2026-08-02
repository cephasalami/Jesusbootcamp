// Repairs only class-tagged contacts that are missing a CTOKEN or its Redis
// reverse index. Requires --apply so an audit can never mutate live data by accident.
import { issueToken, resolveByEmail } from "../src/lib/subscriber.ts";

const apply = process.argv.includes("--apply");
const apiKey = process.env.MAILCHIMP_API_KEY;
const server = process.env.MAILCHIMP_API_SERVER;
const audienceId = process.env.MAILCHIMP_AUDIENCE_ID;
const redisUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
if (!apiKey || !server || !audienceId || !redisUrl || !redisToken) {
    throw new Error("Missing Mailchimp or Upstash environment variables");
}

const headers = { Authorization: `apikey ${apiKey}` };
const apiBase = `https://${server}.api.mailchimp.com/3.0/lists/${audienceId}`;
const redisEndpoint: string = redisUrl;
const redisAuthToken: string = redisToken;

async function fetchWithRetry(url: string, init?: RequestInit): Promise<Response> {
    let lastError: unknown;
    for (let attempt = 1; attempt <= 4; attempt++) {
        try {
            const response = await fetch(url, init);
            if (response.status < 500 && response.status !== 429) return response;
            lastError = new Error(`${response.status} from ${url}`);
        } catch (error) {
            lastError = error;
        }
        if (attempt < 4) await new Promise((resolve) => setTimeout(resolve, attempt * 300));
    }
    throw lastError;
}

async function mailchimp(path: string): Promise<Record<string, unknown>> {
    const response = await fetchWithRetry(`${apiBase}${path}`, { headers });
    if (!response.ok) throw new Error(`Mailchimp ${path} returned ${response.status}`);
    return response.json() as Promise<Record<string, unknown>>;
}

async function redisGet(key: string): Promise<string | null> {
    const response = await fetchWithRetry(redisEndpoint, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${redisAuthToken}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(["GET", key]),
    });
    if (!response.ok) throw new Error(`Upstash GET returned ${response.status}`);
    const result = (await response.json()) as { result?: string | null };
    return result.result ?? null;
}

const segmentPage = await mailchimp("/segments?count=200&type=static");
const segments = (segmentPage.segments ?? []) as Array<{ id: number; name: string }>;
const segment = segments.find((candidate) => candidate.name === "jbc-course-start");
if (!segment) throw new Error('The "jbc-course-start" tag segment does not exist');

const members: Array<{ email_address?: string; merge_fields?: Record<string, string> }> = [];
for (let offset = 0; ; ) {
    const page = await mailchimp(
        `/segments/${segment.id}/members?count=100&offset=${offset}` +
            "&fields=members.email_address,members.merge_fields,total_items"
    );
    const pageMembers = (page.members ?? []) as typeof members;
    members.push(...pageMembers);
    offset = members.length;
    if (!pageMembers.length || offset >= Number(page.total_items ?? 0)) break;
}

const missingTokens: string[] = [];
const missingIndexes: string[] = [];
for (const member of members) {
    const email = String(member.email_address ?? "").trim().toLowerCase();
    const token = String(member.merge_fields?.CTOKEN ?? "").trim();
    if (!email) continue;
    if (!token) {
        missingTokens.push(email);
        continue;
    }
    if (!/^[a-f0-9]{64}$/i.test(token)) continue;
    const rawOwner = await redisGet(`jbc:ctoken:${token}`);
    if (rawOwner == null) missingIndexes.push(email);
}

console.log(JSON.stringify({ tagged: members.length, missingTokens: missingTokens.length, missingIndexes: missingIndexes.length, apply }, null, 2));
if (!apply) process.exit(0);

const repaired: string[] = [];
const failures: string[] = [];
for (const email of missingTokens) {
    try {
        await issueToken(email, { setCourseStartIfMissing: false });
        repaired.push(email);
    } catch (error) {
        failures.push(`${email.replace(/^(.{2}).*@/, "$1***@")} — ${String(error)}`);
    }
}
for (const email of missingIndexes) {
    try {
        const result = await resolveByEmail(email);
        if (!result) throw new Error("contact did not resolve as enrolled");
        repaired.push(email);
    } catch (error) {
        failures.push(`${email.replace(/^(.{2}).*@/, "$1***@")} — ${String(error)}`);
    }
}

console.log(JSON.stringify({ repaired: repaired.length, failures }, null, 2));
if (failures.length) process.exitCode = 1;
