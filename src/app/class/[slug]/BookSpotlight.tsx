"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpen, Download } from "lucide-react";
import type { BookPromotionView } from "@/config/products";
import { selectRotatingBook } from "@/lib/book-rotation";
import styles from "./page.module.css";

const OVERALL_STORAGE_KEY = "jbc:last-promoted-book";
const CLASS_STORAGE_PREFIX = "jbc:last-promoted-book:class:";

function randomFraction(): number {
    try {
        const value = new Uint32Array(1);
        globalThis.crypto.getRandomValues(value);
        return value[0] / 0x1_0000_0000;
    } catch {
        return Math.random();
    }
}

export default function BookSpotlight({
    books,
    classSlug,
}: {
    books: BookPromotionView[];
    classSlug: string;
}) {
    const [book, setBook] = useState<BookPromotionView | null>(null);

    useEffect(() => {
        let active = true;
        let previousForClass: string | null = null;
        let previousOverall: string | null = null;
        const classStorageKey = `${CLASS_STORAGE_PREFIX}${classSlug}`;

        try {
            previousForClass = localStorage.getItem(classStorageKey);
            previousOverall = localStorage.getItem(OVERALL_STORAGE_KEY);
        } catch {
            // Storage can be disabled. Random selection still works; only the
            // no-repeat guarantee is unavailable in that browser mode.
        }

        const selected = selectRotatingBook(
            books,
            previousForClass,
            previousOverall,
            randomFraction()
        );

        if (selected) {
            try {
                localStorage.setItem(classStorageKey, selected.slug);
                localStorage.setItem(OVERALL_STORAGE_KEY, selected.slug);
            } catch {
                // The recommendation remains usable even when storage is full
                // or blocked by the browser.
            }
        }
        // Defer the React update until after this storage-synchronization
        // effect completes, avoiding a synchronous cascading render.
        queueMicrotask(() => {
            if (active) setBook(selected);
        });

        return () => {
            active = false;
        };
    }, [books, classSlug]);

    if (books.length === 0) return null;

    if (!book) {
        return (
            <aside className={`${styles.bookPromo} ${styles.bookPromoLoading}`} aria-hidden="true">
                <span className={styles.bookPromoSkeletonCover} />
                <span className={styles.bookPromoSkeletonCopy}>
                    <span />
                    <span />
                    <span />
                </span>
                <span className={styles.bookPromoSkeletonButton} />
            </aside>
        );
    }

    const headingId = `class-book-${classSlug}`;
    return (
        <aside className={styles.bookPromo} aria-labelledby={headingId}>
            <div className={styles.bookPromoCover}>
                {book.image ? (
                    <Image
                        src={book.image}
                        alt={`${book.title} digital book cover`}
                        fill
                        sizes="(max-width: 599px) 88px, 128px"
                    />
                ) : (
                    <BookOpen size={38} aria-hidden="true" />
                )}
            </div>

            <div className={styles.bookPromoCopy}>
                <span className={styles.bookPromoEyebrow}>Featured digital book</span>
                <h2 id={headingId} className={styles.bookPromoTitle}>
                    {book.title}
                </h2>
                <p className={styles.bookPromoBlurb}>{book.blurb}</p>
                <p className={styles.bookPromoMeta}>
                    <Download size={14} aria-hidden="true" /> Instant PDF download
                </p>
            </div>

            <Link
                href={`/checkout/${encodeURIComponent(book.slug)}`}
                className={styles.bookPromoCta}
                aria-label={`Buy ${book.title} for ${book.price}`}
            >
                <span>Buy the book</span>
                <strong>{book.price}</strong>
                <ArrowRight size={17} aria-hidden="true" />
            </Link>
        </aside>
    );
}
