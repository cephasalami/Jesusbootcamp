"use client";

// Fires a first-party "PageView" to /api/track on initial load and on every
// client-side route change, mirroring the Meta pixel's automatic PageView. Runs
// invisibly (renders nothing) and no-ops server-side / when no store is set.

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { postTrackEvent } from "@/lib/track";

export default function TrackPageView() {
  const pathname = usePathname();

  useEffect(() => {
    // Don't count views of the internal dashboard itself.
    if (pathname?.startsWith("/tracking")) return;
    postTrackEvent("PageView");
  }, [pathname]);

  return null;
}
