"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import styles from "./page.module.css";

/**
 * Fallback identification when `?t=` is missing or unrecognised.
 *
 * Looks the address up via /api/class/identify (which reuses the existing
 * Mailchimp helper), then continues to the class they were trying to reach with
 * a freshly-issued token.
 */
export default function IdentifyForm({ slug }: { slug: string }) {
    const [email, setEmail] = useState("");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const [notFound, setNotFound] = useState("");

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        setNotFound("");
        if (!/^\S+@\S+\.\S+$/.test(email)) {
            setError("Please enter a valid email address.");
            return;
        }
        setBusy(true);
        try {
            const res = await fetch("/api/class/identify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Something went wrong.");
            if (!data.found) {
                setNotFound(data.message || "We couldn't find that email.");
                return;
            }
            // Continue to the class they were originally trying to open.
            window.location.assign(`/class/${encodeURIComponent(slug)}?t=${encodeURIComponent(data.token)}`);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong.");
        } finally {
            setBusy(false);
        }
    }

    return (
        <form className={styles.identifyForm} onSubmit={onSubmit} noValidate>
            <input
                type="email"
                className={styles.identifyInput}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="The email you signed up with"
                autoComplete="email"
                inputMode="email"
                aria-label="Your email address"
                aria-invalid={Boolean(error)}
                disabled={busy}
            />
            <button type="submit" className={styles.identifyBtn} disabled={busy}>
                {busy ? (
                    <>
                        <Loader2 size={16} className={styles.spin} /> Checking…
                    </>
                ) : (
                    "Open my class"
                )}
            </button>
            {error && (
                <p className={styles.identifyError} role="alert">
                    {error}
                </p>
            )}
            {notFound && (
                <p className={styles.identifyNote} role="status">
                    {notFound}
                </p>
            )}
        </form>
    );
}
