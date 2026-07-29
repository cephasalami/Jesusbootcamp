import styles from "./page.module.css";

/**
 * Neutral loading skeleton.
 *
 * The class page resolves the manifest (Sheets) and the subscriber (Mailchimp)
 * on the server, so the browser never receives a provisional locked/unlocked
 * state that then flips. This skeleton covers that round trip and is
 * deliberately state-free — no locks, no open buttons, nothing that could read
 * as an answer before the real one arrives.
 */
export default function Loading() {
    return (
        <main className={styles.page}>
            <div className={styles.shell} aria-busy="true" aria-live="polite">
                <span className={`${styles.skel} ${styles.skelEyebrow}`} />
                <span className={`${styles.skel} ${styles.skelTitle}`} />
                <ul className={styles.formats}>
                    {Array.from({ length: 7 }).map((_, i) => (
                        <li key={i} className={styles.row}>
                            <span className={`${styles.skel} ${styles.skelIcon}`} />
                            <span className={styles.rowBody}>
                                <span className={`${styles.skel} ${styles.skelLine}`} />
                                <span className={`${styles.skel} ${styles.skelLineSm}`} />
                            </span>
                        </li>
                    ))}
                </ul>
                <span className={styles.srOnly}>Loading this class…</span>
            </div>
        </main>
    );
}
