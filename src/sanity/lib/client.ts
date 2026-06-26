import { createClient } from "next-sanity";
import { apiVersion, dataset, projectId } from "../env";

// Null when the project id isn't configured yet — callers guard on this.
export const client = projectId
  ? createClient({
      projectId,
      dataset,
      apiVersion,
      useCdn: true, // published content via the fast CDN
    })
  : null;
