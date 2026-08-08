// src/lib/drip-ledger.ts — the record of which class emails have been sent.
//
// This is what makes the drip idempotent. A cron that retries, a deploy that
// overlaps a run, or two invocations racing must never mean a subscriber
// receives the same class twice.
//
// ⚠️ FAILS CLOSED, unlike everything else in this codebase.
//
// subscriber-store.ts fails OPEN: if KV is unreachable it returns null and the
// caller falls back to Mailchimp, because refusing to render a class page is
// worse than a slow one. Here the calculus inverts. If we cannot read the
// ledger we do not know what has already been sent, and the failure modes are
// not symmetric:
//
//   • Not sending  → the subscriber gets the class an hour later. Nobody notices.
//   • Sending twice → a duplicate email from a domain already fighting for
//                     inbox placement, and the recipient reaches for "spam".
//
// So an unreadable ledger means SKIP, every time.

import { isKvConfigured, kvPipeline, kvSetAdd, type KvCommand } from "./kv.ts";

const ROOT = "jbc:sent:v1";
/** Durable. A sent email can never be un-sent, so this must outlive any cache. */
const NO_EXPIRY = 0;

function ledgerKey(email: string): string {
    return `${ROOT}:${email.trim().toLowerCase()}`;
}

/**
 * Every class slug already sent to this person.
 *
 * Returns null when KV cannot be read — callers MUST treat null as "do not
 * send", never as "nothing sent yet". Those two are indistinguishable here and
 * only one of them is safe.
 */
export async function readSentSlugs(email: string): Promise<Set<string> | null> {
    if (!isKvConfigured) return null;
    const commands: KvCommand[] = [["SMEMBERS", ledgerKey(email)]];
    const out = await kvPipeline<string[]>(commands);
    if (!out) return null;
    const members = Array.isArray(out[0]) ? (out[0] as unknown[]) : [];
    return new Set(members.map(String));
}

/**
 * Record a class as sent. Returns false when the write could not be confirmed.
 *
 * A false here is serious: the email HAS gone out but we failed to remember it,
 * so the next run would send it again. The caller should log loudly rather than
 * treat it as routine.
 */
export async function recordSent(email: string, slug: string): Promise<boolean> {
    if (!isKvConfigured) return false;
    return kvSetAdd(ledgerKey(email), slug, NO_EXPIRY);
}

/**
 * Seed the ledger without sending anything — used when switching a subscriber
 * over from Mailchimp's automation, so the app-owned drip resumes where
 * Mailchimp left off instead of restarting them at class 1.
 */
export async function markAlreadySent(email: string, slugs: string[]): Promise<boolean> {
    if (!isKvConfigured || slugs.length === 0) return false;
    const key = ledgerKey(email);
    const out = await kvPipeline([["SADD", key, ...slugs] as KvCommand]);
    return out !== null;
}
