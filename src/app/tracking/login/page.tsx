"use client";

import { useActionState } from "react";
import { login, type LoginState } from "../actions";
import styles from "../tracking.module.css";

const initial: LoginState = {};

export default function TrackingLoginPage() {
  const [state, formAction, pending] = useActionState(login, initial);

  return (
    <main className={styles.loginPage}>
      <div className={styles.loginCard}>
        <h1 className={styles.loginTitle}>Tracking &amp; Analytics</h1>
        <p className={styles.loginSub}>This dashboard is password protected.</p>

        <form action={formAction} className={styles.loginForm}>
          <label className={styles.label} htmlFor="password">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            className={styles.input}
            autoComplete="current-password"
            autoFocus
            required
          />
          {state?.error ? <p className={styles.loginError}>{state.error}</p> : null}
          <button type="submit" className={styles.loginBtn} disabled={pending}>
            {pending ? "Checking…" : "Enter"}
          </button>
        </form>
      </div>
    </main>
  );
}
