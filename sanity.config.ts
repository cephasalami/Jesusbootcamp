"use client";

import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { visionTool } from "@sanity/vision";
import { apiVersion, dataset, projectId } from "./src/sanity/env";
import { schemaTypes } from "./src/sanity/schemaTypes";

// Embedded Sanity Studio served at /studio.
// projectId falls back to a placeholder so the build never crashes before the
// real NEXT_PUBLIC_SANITY_PROJECT_ID env var is set.
export default defineConfig({
  basePath: "/studio",
  projectId: projectId || "placeholder",
  dataset,
  schema: { types: schemaTypes },
  plugins: [structureTool(), visionTool({ defaultApiVersion: apiVersion })],
});
