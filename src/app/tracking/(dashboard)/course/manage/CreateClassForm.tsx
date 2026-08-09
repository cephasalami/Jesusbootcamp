"use client";

import { Plus } from "lucide-react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createCourseClass, type CreateClassState } from "../../../course-actions";
import styles from "./manage.module.css";

export default function CreateClassForm() {
    const router = useRouter();
    const [slug, setSlug] = useState("");
    const [sequencePosition, setSequencePosition] = useState("");
    const [title, setTitle] = useState("");
    const [result, setResult] = useState<CreateClassState | null>(null);
    const [isPending, startTransition] = useTransition();

    function submit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setResult(null);
        startTransition(async () => {
            const next = await createCourseClass({ slug, sequencePosition, title });
            setResult(next);
            if (!next.ok) return;

            setSlug("");
            setSequencePosition("");
            setTitle("");
            // The material-link selector receives its class list from the
            // server. Refresh it so the newly appended class is selectable.
            router.refresh();
        });
    }

    return (
        <form className={styles.form} onSubmit={submit}>
            <div className={styles.createGrid}>
                <label className={styles.field}>
                    <span>Class slug</span>
                    <input
                        value={slug}
                        onChange={(event) => setSlug(event.target.value)}
                        placeholder="5 or 5a"
                        autoCapitalize="none"
                        maxLength={40}
                        disabled={isPending}
                    />
                    <small>Lowercase letters, numbers and hyphens only.</small>
                </label>
                <label className={styles.field}>
                    <span>Release position</span>
                    <input
                        type="number"
                        min="0"
                        step="1"
                        inputMode="numeric"
                        value={sequencePosition}
                        onChange={(event) => setSequencePosition(event.target.value)}
                        placeholder="6"
                        disabled={isPending}
                    />
                    <small>Must be unique; it sets the class&apos;s drip order.</small>
                </label>
                <label className={styles.field}>
                    <span>Class title</span>
                    <input
                        value={title}
                        onChange={(event) => setTitle(event.target.value)}
                        placeholder="Walking in the Spirit"
                        maxLength={160}
                        disabled={isPending}
                    />
                    <small>Materials can be attached after the class is created.</small>
                </label>
            </div>

            <div className={styles.actions}>
                <button className={styles.saveButton} type="submit" disabled={isPending}>
                    <Plus size={16} /> {isPending ? "Creating…" : "Create class"}
                </button>
            </div>

            {result ? (
                <p className={result.ok ? styles.success : styles.error} role="status" aria-live="polite">
                    {result.ok
                        ? `Class ${result.slug.toUpperCase()} has been created. Select it below to add its first material.`
                        : result.error}
                </p>
            ) : null}
        </form>
    );
}
