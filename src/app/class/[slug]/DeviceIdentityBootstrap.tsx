"use client";

import { useEffect } from "react";

/**
 * Server Components may read cookies but cannot set them. After a valid CTOKEN
 * page renders, this same-origin POST asks a Route Handler to remember the
 * browser. It has no UI and never changes the primary CTOKEN navigation flow.
 */
export default function DeviceIdentityBootstrap({ token }: { token: string }) {
    useEffect(() => {
        if (!/^[a-f0-9]{64}$/i.test(token)) return;

        const controller = new AbortController();
        void fetch("/api/class/device", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "same-origin",
            body: JSON.stringify({ token }),
            signal: controller.signal,
        }).catch(() => {
            // The page already has a valid URL token. Remembering this device
            // may retry on a later class visit without interrupting the learner.
        });

        return () => controller.abort();
    }, [token]);

    return null;
}
