"use client";

import { Plus } from "lucide-react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createCourseClass, type CreateClassState } from "../../../course-actions";
import {
    MATERIAL_LINK_FORMATS,
    MATERIAL_LINK_LABELS,
    type MaterialLinkFormat,
} from "@/lib/material-link";
import styles from "./manage.module.css";

function emptyMaterials(): Record<MaterialLinkFormat, string> {
    return Object.fromEntries(MATERIAL_LINK_FORMATS.map((format) => [format, ""])) as Record<MaterialLinkFormat, string>;
}

export default function CreateClassForm() {
    const router = useRouter();
    const [slug, setSlug] = useState("");
    const [sequencePosition, setSequencePosition] = useState("");
    const [title, setTitle] = useState("");
    const [materials, setMaterials] = useState<Record<MaterialLinkFormat, string>>(emptyMaterials);
    const [result, setResult] = useState<CreateClassState | null>(null);
    const [isPending, startTransition] = useTransition();

    function submit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setResult(null);
        startTransition(async () => {
            const next = await createCourseClass({ slug, sequencePosition, title, materials });
            setResult(next);
            if (!next.ok) return;

            setSlug("");
            setSequencePosition("");
            setTitle("");
            setMaterials(emptyMaterials());
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
                    <small>Links below can be added now or later.</small>
                </label>
            </div>

            <fieldset className={styles.createMaterials}>
                <legend>Class materials <span>Optional — add every ready material now.</span></legend>
                <div className={styles.materialGrid}>
                    {MATERIAL_LINK_FORMATS.map((format) => {
                        const isQuiz = format === "quiz";
                        return (
                            <label key={format} className={styles.field}>
                                <span>{MATERIAL_LINK_LABELS[format]}</span>
                                <input
                                    type="text"
                                    inputMode="url"
                                    value={materials[format]}
                                    onChange={(event) => setMaterials((current) => ({ ...current, [format]: event.target.value }))}
                                    placeholder={isQuiz ? "https://…/viewform" : "Google Drive link or file ID"}
                                    disabled={isPending}
                                />
                                <small>{isQuiz ? "Use a public quiz share link." : "Leave blank if it is not ready yet."}</small>
                            </label>
                        );
                    })}
                </div>
            </fieldset>

            <div className={styles.actions}>
                <button className={styles.saveButton} type="submit" disabled={isPending}>
                    <Plus size={16} /> {isPending ? "Creating…" : "Create class"}
                </button>
            </div>

            {result ? (
                <p className={result.ok ? styles.success : styles.error} role="status" aria-live="polite">
                    {result.ok
                        ? `Class ${result.slug.toUpperCase()} has been created. You can add or update materials below at any time.`
                        : result.error}
                </p>
            ) : null}
        </form>
    );
}
