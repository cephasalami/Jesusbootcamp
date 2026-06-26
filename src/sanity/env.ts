// Sanity project configuration, read from environment variables.
// The site is "safe when unconfigured": if no project id is set, the blog
// renders a friendly empty state instead of crashing the build/deploy.
export const apiVersion =
  process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2024-10-01";

export const dataset =
  process.env.NEXT_PUBLIC_SANITY_DATASET || "production";

export const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;

/** True once a Sanity project id has been provided via env. */
export const isSanityConfigured = Boolean(projectId);
