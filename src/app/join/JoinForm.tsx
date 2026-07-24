"use client";

import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { trackFbEvent } from "@/lib/fbq";
import styles from "./page.module.css";

export default function JoinForm() {
    const [firstName, setFirstName] = useState("");
    const [email, setEmail] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [done, setDone] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        if (!/^\S+@\S+\.\S+$/.test(email)) {
            setError("Please enter a valid email address.");
            return;
        }
        setSubmitting(true);
        try {
            const res = await fetch("/api/join", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, firstName }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Something went wrong. Please try again.");
            setDone(true);
            trackFbEvent("Lead", { content_name: "Jesus Boot Camp — Join" });
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
        } finally {
            setSubmitting(false);
        }
    }

    if (done) {
        return (
            <div className={styles.success} role="status">
                <span className={styles.successIcon}>
                    <CheckCircle2 size={28} />
                </span>
                <h2 className={`${styles.headingDisplay} ${styles.successTitle}`}>
                    You&apos;re enlisted{firstName ? `, ${firstName}` : ""}.
                </h2>
                <p className={styles.successText}>
                    Your first class is on its way to <strong>{email}</strong>. Over the next 90 days
                    you&apos;ll get the lessons in order — one step at a time, straight to your inbox.
                    Keep an eye out (and check your spam folder if the first one is slow to arrive).
                </p>
                <p className={styles.successShare}>
                    Know someone who needs this? Send them{" "}
                    <span className={styles.successShareUrl}>jesusbootcamp.org/join</span>.
                </p>
            </div>
        );
    }

    return (
        <form className={styles.form} onSubmit={handleSubmit} noValidate>
            <div className={styles.formHead}>Start the 90-day training — free</div>
            <div className={styles.formRow}>
                <input
                    type="text"
                    className={styles.input}
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="First name (optional)"
                    autoComplete="given-name"
                    aria-label="First name"
                />
                <input
                    type="email"
                    className={styles.input}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    autoComplete="email"
                    inputMode="email"
                    aria-label="Email address"
                    aria-invalid={Boolean(error)}
                    required
                />
            </div>
            {error && (
                <p className={styles.error} role="alert">
                    {error}
                </p>
            )}
            <button type="submit" className={styles.submit} disabled={submitting}>
                {submitting ? (
                    <>
                        <Loader2 size={18} className={styles.spin} /> Enlisting…
                    </>
                ) : (
                    "Join the Boot Camp →"
                )}
            </button>
            <p className={styles.formNote}>
                Free. The first class arrives by email. Unsubscribe anytime.
            </p>
        </form>
    );
}
