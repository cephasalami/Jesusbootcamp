// Read-only audit of CTOKEN coverage for contacts enrolled in the class journey.
import { writeFile } from "node:fs/promises";

const detailsFileIndex = process.argv.indexOf("--details-file");
const detailsFile = detailsFileIndex >= 0 ? process.argv[detailsFileIndex + 1] : null;
if (detailsFileIndex >= 0 && !detailsFile) throw new Error("--details-file requires a path");

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

async function fetchWithRetry(url, init) {
    let lastError;
    for (let attempt = 1; attempt <= 4; attempt++) {
        try {
            return await fetch(url, init);
        } catch (error) {
            lastError = error;
            if (attempt < 4) await new Promise((resolve) => setTimeout(resolve, attempt * 250));
        }
    }
    throw lastError;
}

async function mailchimp(path) {
    const response = await fetchWithRetry(`${apiBase}${path}`, { headers });
    if (!response.ok) throw new Error(`Mailchimp ${path} returned ${response.status}`);
    return response.json();
}

async function redis(...args) {
    const response = await fetchWithRetry(redisUrl, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${redisToken}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(args),
    });
    if (!response.ok) throw new Error(`Upstash ${args[0]} returned ${response.status}`);
    return (await response.json()).result ?? null;
}

const segments = await mailchimp("/segments?count=200&type=static");
const courseSegment = (segments.segments ?? []).find((segment) => segment.name === "jbc-course-start");
if (!courseSegment) throw new Error('The "jbc-course-start" tag segment does not exist');

const members = [];
for (let offset = 0; ; ) {
    const page = await mailchimp(
        `/segments/${courseSegment.id}/members?count=100&offset=${offset}` +
            "&fields=members.email_address,members.merge_fields,members.last_changed,total_items"
    );
    members.push(...(page.members ?? []));
    offset = members.length;
    if (!page.members?.length || offset >= (page.total_items ?? 0)) break;
}

const audit = {
    tagged: members.length,
    missingToken: 0,
    malformedToken: 0,
    indexMissing: 0,
    indexMismatch: 0,
    ttlMissing: 0,
    minTtlSeconds: null,
    maxTtlSeconds: null,
};
const details = [];

for (const member of members) {
    const email = String(member.email_address ?? "").trim().toLowerCase();
    const token = String(member.merge_fields?.CTOKEN ?? "").trim();
    const detail = {
        email,
        token,
        tokenValid: /^[a-f0-9]{64}$/i.test(token),
        indexOwner: null,
        indexMatches: false,
        ttlSeconds: null,
        lastChanged: member.last_changed ?? null,
    };
    if (!token) {
        audit.missingToken++;
        details.push(detail);
        continue;
    }
    if (!/^[a-f0-9]{64}$/i.test(token)) {
        audit.malformedToken++;
        details.push(detail);
        continue;
    }

    const key = `jbc:ctoken:${token}`;
    const rawOwner = await redis("GET", key);
    if (rawOwner == null) {
        audit.indexMissing++;
        details.push(detail);
        continue;
    }
    let owner = rawOwner;
    try {
        owner = JSON.parse(rawOwner);
    } catch {
        // A legacy unquoted email is still safe to compare during the audit.
    }
    detail.indexOwner = String(owner).trim().toLowerCase();
    detail.indexMatches = detail.indexOwner === email;
    if (!detail.indexMatches) audit.indexMismatch++;

    const ttl = Number(await redis("TTL", key));
    detail.ttlSeconds = Number.isFinite(ttl) ? ttl : null;
    if (!Number.isFinite(ttl) || ttl <= 0) {
        audit.ttlMissing++;
        details.push(detail);
        continue;
    }
    audit.minTtlSeconds = audit.minTtlSeconds == null ? ttl : Math.min(audit.minTtlSeconds, ttl);
    audit.maxTtlSeconds = audit.maxTtlSeconds == null ? ttl : Math.max(audit.maxTtlSeconds, ttl);
    details.push(detail);
}

if (detailsFile) await writeFile(detailsFile, JSON.stringify(details, null, 2), "utf8");
console.log(JSON.stringify(audit, null, 2));
