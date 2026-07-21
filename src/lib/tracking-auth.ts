// src/lib/tracking-auth.ts — SERVER-ONLY.
//
// Minimal password gate for the internal /tracking dashboard. This is an
// intentionally simple shared-password gate (not a full user-auth system) — it
// keeps the analytics page off the public web behind the password Paul chose.
//
// The session cookie holds an HMAC-signed, tamper-proof token so the cookie
// cannot be forged without the server secret. It never stores the password.
//
// Configure via env. BOTH are REQUIRED in production — the gate fails closed
// (refuses every login and rejects every session) if either is missing on a
// production deploy, so the dashboard's customer PII can never be reached with
// the source-known dev defaults below.
//   TRACKING_PASSWORD        the login password
//   TRACKING_SESSION_SECRET  long random HMAC signing secret
// In development only, convenient defaults apply so the gate works out of the box.

import { createHmac, timingSafeEqual } from "node:crypto";

export const TRACKING_COOKIE = "jbc_track_session";

/** How long a login stays valid, in seconds (30 days). */
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30;

const IS_PROD = process.env.NODE_ENV === "production";
// Dev-only convenience default; NEVER usable in production (see fail-closed below).
const DEV_FALLBACK_PASSWORD = "Paul2Linda";

/**
 * The gate is securely configured when a real password AND a real signing secret
 * are set. In production we REQUIRE both; in development the built-in defaults
 * are allowed so the dashboard works locally without setup.
 */
export function isTrackingConfigured(): boolean {
  if (!IS_PROD) return true;
  return Boolean(process.env.TRACKING_PASSWORD && process.env.TRACKING_SESSION_SECRET);
}

function getPassword(): string {
  return process.env.TRACKING_PASSWORD || DEV_FALLBACK_PASSWORD;
}

function getSecret(): string {
  return (
    process.env.TRACKING_SESSION_SECRET || `jbc-tracking-session::${getPassword()}`
  );
}

function base64url(input: Buffer | string): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function sign(data: string): string {
  return base64url(createHmac("sha256", getSecret()).update(data).digest());
}

/** Constant-time string compare that never throws on length mismatch. */
function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

/** True if the submitted password matches (constant-time). Fails closed when
 * the gate is not securely configured in production. */
export function passwordMatches(submitted: string): boolean {
  if (!isTrackingConfigured()) return false;
  return safeEqual(submitted ?? "", getPassword());
}

/** Create a signed session token: `<base64url(payload)>.<signature>`. */
export function createSessionToken(): string {
  const payload = base64url(JSON.stringify({ iat: Date.now() }));
  return `${payload}.${sign(payload)}`;
}

/** Verify a session token: valid signature AND not older than SESSION_MAX_AGE.
 * Rejects every token when the gate is not securely configured in production
 * (so a source-derived fallback secret can never validate a forged cookie). */
export function verifySessionToken(token: string | undefined | null): boolean {
  if (!isTrackingConfigured()) return false;
  if (!token) return false;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;
  if (!safeEqual(signature, sign(payload))) return false;
  try {
    const { iat } = JSON.parse(
      Buffer.from(payload, "base64").toString("utf8")
    ) as { iat?: number };
    if (typeof iat !== "number") return false;
    return Date.now() - iat < SESSION_MAX_AGE * 1000;
  } catch {
    return false;
  }
}
