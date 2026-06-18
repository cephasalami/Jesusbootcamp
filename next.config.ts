import type { NextConfig } from "next";

// Conservative, broadly-compatible security headers. CSP is intentionally
// omitted here — a strict policy needs per-app testing (inline styles, Next
// runtime scripts, Mailchimp) and a wrong CSP would break the live site.
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // Canonicalize www -> apex (avoids duplicate-content indexing).
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.jesusbootcamp.org" }],
        destination: "https://jesusbootcamp.org/:path*",
        permanent: true,
      },
    ];
  },
  async rewrites() {
    return [
      // Serve the app icon for legacy bare /favicon.ico requests (no redirect).
      { source: "/favicon.ico", destination: "/icon.jpg" },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
