"use client";

import ReactDOM from "react-dom";

/**
 * Warm the only third-party origin a class page embeds directly. This is a
 * connection hint, not a media download: it saves the DNS/TLS round trips
 * before the learner starts a Drive-hosted video or presentation without using
 * their data plan to fetch a whole file they may never play.
 */
export default function ClassMediaWarmup() {
    ReactDOM.preconnect("https://drive.google.com", { crossOrigin: "anonymous" });
    return null;
}
