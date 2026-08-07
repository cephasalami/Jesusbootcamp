"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";
import styles from "../../tracking.module.css";

type Result = { email: string; status: "enrolled" | "failed"; detail?: string };
type Response = { submitted: number; enrolled: number; failed: number; results: Result[] };

export default function EnrollForm() {
  const [emails, setEmails] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Response | null>(null);

  // Cheap client-side count so the admin can sanity-check a big paste before
  // committing to it. The server parses independently — this is only a preview.
  const detected = new Set(
    emails
      .split(/[\s,;]+/)
      .map((value) => value.trim().toLowerCase())
      .filter((value) => /^\S+@\S+\.\S+$/.test(value))
  ).size;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const response = await fetch("/api/tracking/enroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emails }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data?.error ?? "Enrolment failed.");
      } else {
        setResult(data as Response);
        if (data.failed === 0) setEmails("");
      }
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <form className={styles.enrollForm} onSubmit={submit}>
        <label className={styles.label} htmlFor="emails">
          Email addresses
        </label>
        <textarea
          id="emails"
          className={styles.textarea}
          value={emails}
          onChange={(event) => setEmails(event.target.value)}
          rows={10}
          placeholder={"paul@example.com\nlinda@example.com\n\nOr paste them separated by commas, spaces or new lines."}
          disabled={busy}
        />
        <div className={styles.enrollActions}>
          <span className={styles.enrollCount}>
            {detected === 0 ? "No addresses detected yet" : `${detected} address${detected === 1 ? "" : "es"} detected`}
          </span>
          <button className={styles.btn} type="submit" disabled={busy || detected === 0}>
            <UserPlus size={15} /> {busy ? "Enrolling…" : `Enrol ${detected || ""}`.trim()}
          </button>
        </div>
      </form>

      {error ? <p className={styles.errorBanner}>{error}</p> : null}

      {result ? (
        <div className={styles.enrollResult}>
          <p>
            <strong>{result.enrolled}</strong> enrolled
            {result.failed > 0 ? (
              <>
                {" · "}
                <strong className={styles.refund}>{result.failed} failed</strong>
              </>
            ) : null}{" "}
            of {result.submitted} submitted.
          </p>
          {result.failed > 0 ? (
            <ul className={styles.enrollFailures}>
              {result.results
                .filter((row) => row.status === "failed")
                .map((row) => (
                  <li key={row.email}>
                    <code>{row.email}</code> — {row.detail ?? "failed"}
                  </li>
                ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
