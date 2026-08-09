"use client";

import { ExternalLink, Eye, Save, X } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import {
    MATERIAL_LINK_FORMATS,
    MATERIAL_LINK_LABELS,
    previewUrlForMaterial,
    type MaterialLinkFormat,
} from "@/lib/material-link";
import { saveCourseMaterialLink, type SaveMaterialLinkState } from "../../../course-actions";
import styles from "./manage.module.css";

type Course = { slug: string; title: string };

export default function MaterialLinkManager({ classes }: { classes: Course[] }) {
    const [classSlug, setClassSlug] = useState(classes[0]?.slug ?? "");
    const [format, setFormat] = useState<MaterialLinkFormat>("pdf");
    const [link, setLink] = useState("");
    const [previewing, setPreviewing] = useState(false);
    const [result, setResult] = useState<SaveMaterialLinkState | null>(null);
    const [isPending, startTransition] = useTransition();

    const previewUrl = useMemo(() => previewUrlForMaterial(format, link), [format, link]);
    const invalidLink = link.trim().length > 0 && !previewUrl;
    const selectedClass = classes.find((klass) => klass.slug === classSlug);
    const isQuiz = format === "quiz";

    function updateLink(next: string) {
        setLink(next);
        setPreviewing(false);
        setResult(null);
    }

    function changeFormat(next: MaterialLinkFormat) {
        setFormat(next);
        setPreviewing(false);
        setResult(null);
    }

    function submit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!previewUrl) return;

        startTransition(async () => {
            const next = await saveCourseMaterialLink({ classSlug, format, link });
            setResult(next);
            if (next.ok) setPreviewing(false);
        });
    }

    return (
        <>
            <form className={styles.form} onSubmit={submit}>
                <div className={styles.fieldGrid}>
                    <label className={styles.field}>
                        <span>Class</span>
                        <select value={classSlug} onChange={(event) => setClassSlug(event.target.value)} disabled={isPending}>
                            {classes.map((klass) => (
                                <option key={klass.slug} value={klass.slug}>
                                    Class {klass.slug.toUpperCase()} — {klass.title}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label className={styles.field}>
                        <span>Material type</span>
                        <select value={format} onChange={(event) => changeFormat(event.target.value as MaterialLinkFormat)} disabled={isPending}>
                            {MATERIAL_LINK_FORMATS.map((type) => (
                                <option key={type} value={type}>{MATERIAL_LINK_LABELS[type]}</option>
                            ))}
                        </select>
                    </label>
                </div>

                <label className={styles.field}>
                    <span>{isQuiz ? "Quiz share link" : "Google Drive file link or file ID"}</span>
                    <input
                        type="text"
                        inputMode="url"
                        value={link}
                        onChange={(event) => updateLink(event.target.value)}
                        placeholder={isQuiz ? "https://docs.google.com/forms/d/e/.../viewform" : "https://drive.google.com/file/d/.../view"}
                        disabled={isPending}
                    />
                    <small>
                        {isQuiz
                            ? "Use the public form link, not an editor URL."
                            : "Pasting a Drive file ID also works; the long sharing URL is not stored."}
                    </small>
                </label>

                {invalidLink ? (
                    <p className={styles.validation} role="alert">
                        {isQuiz
                            ? "Enter a public http(s) quiz link. Google Forms /edit links cannot be shared with learners."
                            : "Enter a valid Google Drive file link or file ID to preview and save this material."}
                    </p>
                ) : null}

                <div className={styles.actions}>
                    <button
                        className={styles.previewButton}
                        type="button"
                        onClick={() => setPreviewing(true)}
                        disabled={!previewUrl || isPending}
                    >
                        <Eye size={16} /> Preview material
                    </button>
                    <button className={styles.saveButton} type="submit" disabled={!previewUrl || isPending}>
                        <Save size={16} /> {isPending ? "Saving…" : "Save material link"}
                    </button>
                </div>
            </form>

            {previewing && previewUrl ? (
                <section className={styles.preview} aria-label="Material preview">
                    <div className={styles.previewHeader}>
                        <div>
                            <strong>{MATERIAL_LINK_LABELS[format]} preview</strong>
                            <span>{selectedClass ? `Class ${selectedClass.slug.toUpperCase()} — ${selectedClass.title}` : "Selected class"}</span>
                        </div>
                        <div className={styles.previewActions}>
                            <a href={previewUrl} target="_blank" rel="noreferrer">
                                Open in new tab <ExternalLink size={14} />
                            </a>
                            <button type="button" onClick={() => setPreviewing(false)} aria-label="Close preview">
                                <X size={17} />
                            </button>
                        </div>
                    </div>
                    <iframe className={styles.previewFrame} src={previewUrl} title={`${MATERIAL_LINK_LABELS[format]} preview`} />
                </section>
            ) : null}

            {result ? (
                <p className={result.ok ? styles.success : styles.error} role="status" aria-live="polite">
                    {result.ok
                        ? `${MATERIAL_LINK_LABELS[format]} saved for Class ${selectedClass?.slug.toUpperCase() ?? classSlug.toUpperCase()}.`
                        : result.error}
                </p>
            ) : null}
        </>
    );
}
