"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { logout } from "./actions";
import styles from "./tracking.module.css";

export default function Toolbar() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [refreshing, setRefreshing] = useState(false);

  function refresh() {
    setRefreshing(true);
    startTransition(() => {
      router.refresh();
      // router.refresh resolves quickly; clear the label shortly after.
      setTimeout(() => setRefreshing(false), 600);
    });
  }

  return (
    <div className={styles.toolbar}>
      <button
        type="button"
        className={styles.btnGhost}
        onClick={refresh}
        disabled={pending || refreshing}
      >
        {refreshing ? "Refreshing…" : "Refresh"}
      </button>
      <form action={logout}>
        <button type="submit" className={styles.btn}>
          Log out
        </button>
      </form>
    </div>
  );
}
