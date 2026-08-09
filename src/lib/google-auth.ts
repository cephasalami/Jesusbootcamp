// src/lib/google-auth.ts — SERVER-ONLY Google service-account auth.
//
// Shared by lib/drive.ts and lib/manifest.ts so credentials are parsed and the
// access token is cached in exactly one place.
//
// DEPENDENCY NOTE: we deliberately do NOT use the `googleapis` package. It is
// ~207 MB unpacked, and Vercel's serverless bundle ceiling is 250 MB — it would
// nearly exhaust the budget to call two REST endpoints (Drive files.get and
// Sheets values.get). `google-auth-library` (~600 KB) handles the JWT signing
// and token refresh correctly, and the two endpoints are plain `fetch` calls.
//
// NEVER import this from a client component — it reads the private key.
import { JWT } from "google-auth-library";

/**
 * Base64-encoded service-account JSON. Base64 because the raw JSON contains
 * newlines in `private_key`, which are awkward and error-prone as a raw Vercel
 * env value. See .env.example.
 */
const RAW = process.env.GOOGLE_SERVICE_ACCOUNT_JSON_BASE64;

/**
 * Drive stays read-only. The protected owner dashboard may update the class
 * manifest Sheet, so it needs the spreadsheet write scope (the Sheet itself
 * must still be shared with the service account as an Editor).
 */
const SCOPES = [
    "https://www.googleapis.com/auth/drive.readonly",
    "https://www.googleapis.com/auth/spreadsheets",
];

export const isGoogleConfigured = Boolean(RAW);

type ServiceAccount = { client_email: string; private_key: string };

let cachedClient: JWT | null = null;
let parseError: string | null = null;

function parseCredentials(): ServiceAccount | null {
    if (!RAW) return null;
    try {
        // Tolerate either base64 or (as a convenience in local dev) raw JSON.
        const text = RAW.trim().startsWith("{")
            ? RAW
            : Buffer.from(RAW, "base64").toString("utf8");
        const json = JSON.parse(text) as Partial<ServiceAccount>;
        if (!json.client_email || !json.private_key) {
            parseError = "service account JSON is missing client_email or private_key";
            return null;
        }
        return { client_email: json.client_email, private_key: json.private_key };
    } catch (err) {
        parseError = err instanceof Error ? err.message : "unparseable";
        return null;
    }
}

/**
 * A lazily-built, cached JWT client. Returns null (never throws) when Google
 * isn't configured, so callers can degrade gracefully instead of 500-ing a page.
 */
function getClient(): JWT | null {
    if (cachedClient) return cachedClient;
    const creds = parseCredentials();
    if (!creds) {
        if (parseError) console.error(`[google-auth] credentials unusable: ${parseError}`);
        return null;
    }
    cachedClient = new JWT({
        email: creds.client_email,
        key: creds.private_key,
        scopes: SCOPES,
    });
    return cachedClient;
}

/**
 * A valid OAuth access token for the service account, or null when Google isn't
 * configured / auth fails. `google-auth-library` caches and refreshes the token
 * internally, so this is cheap to call per request.
 */
export async function getAccessToken(): Promise<string | null> {
    const client = getClient();
    if (!client) return null;
    try {
        const res = await client.getAccessToken();
        return res?.token ?? null;
    } catch (err) {
        console.error("[google-auth] failed to mint access token:", err);
        return null;
    }
}

/** The service account's email — surfaced in setup docs so the folder can be shared with it. */
export function serviceAccountEmail(): string | null {
    return parseCredentials()?.client_email ?? null;
}
