import type { MetadataRoute } from "next";

const BASE_URL = "https://jesusbootcamp.org";

export default function sitemap(): MetadataRoute.Sitemap {
  // Only list indexable pages. /handbook and /power-for-the-hour are
  // intentionally excluded — they are noindex ad landing pages.
  const routes = [
    { path: "/", priority: 1 },
    { path: "/why-the-boot-camp", priority: 0.8 },
    { path: "/blog", priority: 0.7 },
    { path: "/privacy", priority: 0.3 },
  ];

  return routes.map((route) => ({
    url: `${BASE_URL}${route.path}`,
    changeFrequency: "monthly",
    priority: route.priority,
  }));
}
