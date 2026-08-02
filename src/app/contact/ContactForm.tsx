"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Loader2, Mail } from "lucide-react";
import styles from "./page.module.css";

type Props = {
    classSlug: string;
    contactEmail: string;
};

export default function ContactForm({ classSlug, contactEmail }: Props) {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [website, setWebsite] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [done, setDone] = useState(false);
    const [error, setError] = useState("");
    const [showEmailFallback, setShowEmailFallback] = useState(false);

    const mailto = useMemo(() => {
        const subject = classSlug
            ? `Jesus Boot Camp class ${classSlug.toUpperCase()} help`
            : "Jesus Boot Camp website help";
        const body = [
            `Name: ${name}`,
            `Email: ${email}`,
            classSlug ? `Class: ${classSlug.toUpperCase()}` : "",
            "",
            message,
        ]
            .filter((line) => line !== "")
            .join("\n");
        return `mailto:${contactEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    }, [classSlug, contactEmail, email, message, name]);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError("");
        setShowEmailFallback(false);
        setSubmitting(true);

        try {
            const response = await fetch("/api/contact", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, message, classSlug, website }),
            });
            const result = (await response.json()) as {
                success?: boolean;
                error?: string;
                email?: string;
            };

            if (!response.ok || !result.success) {
                setShowEmailFallback(Boolean(result.email));
                throw new Error(result.error || "We could not send your message. Please try again.");
            }

            setDone(true);
        } catch (submitError) {
            setError(
                submitError instanceof Error
                    ? submitError.message
                    : "We could not send your message. Please try again."
            );
        } finally {
            setSubmitting(false);
        }
    }

    if (done) {
        return (
            <div className={styles.success} role="status">
                <CheckCircle2 size={30} aria-hidden="true" />
                <div>
                    <h2>Message sent</h2>
                    <p>Thank you. The Jesus Boot Camp team will get back to you by email.</p>
                </div>
            </div>
        );
    }

    return (
        <form className={styles.form} onSubmit={handleSubmit} noValidate>
            {classSlug && (
                <p className={styles.classContext}>
                    This message will be marked as concerning <strong>Class {classSlug.toUpperCase()}</strong>.
                </p>
            )}

            <label className={styles.field}>
                <span>Name</span>
                <input
                    type="text"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    autoComplete="name"
                    maxLength={100}
                    required
                />
            </label>

            <label className={styles.field}>
                <span>Email</span>
                <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    autoComplete="email"
                    inputMode="email"
                    maxLength={254}
                    required
                />
            </label>

            <label className={styles.field}>
                <span>What happened?</span>
                <textarea
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    rows={7}
                    maxLength={4000}
                    placeholder="Tell us which class or material is not working. If you are a partner and something is locked, please mention that here."
                    required
                />
            </label>

            <label className={styles.honeypot} aria-hidden="true">
                Website
                <input
                    type="text"
                    value={website}
                    onChange={(event) => setWebsite(event.target.value)}
                    tabIndex={-1}
                    autoComplete="off"
                />
            </label>

            {error && (
                <div className={styles.error} role="alert">
                    <p>{error}</p>
                    {showEmailFallback && (
                        <a href={mailto} className={styles.emailFallback}>
                            <Mail size={17} aria-hidden="true" /> Email {contactEmail}
                        </a>
                    )}
                </div>
            )}

            <button className={styles.submit} type="submit" disabled={submitting}>
                {submitting ? (
                    <>
                        <Loader2 className={styles.spin} size={18} aria-hidden="true" /> Sending…
                    </>
                ) : (
                    "Send message"
                )}
            </button>
        </form>
    );
}
