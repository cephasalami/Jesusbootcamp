import imageUrlBuilder from "@sanity/image-url";
import type { SanityImageSource } from "@sanity/image-url";
import { dataset, projectId } from "../env";

const builder = projectId ? imageUrlBuilder({ projectId, dataset }) : null;

/** Returns a Sanity image URL builder, or null when unconfigured. */
export function urlForImage(source: SanityImageSource) {
  return builder ? builder.image(source) : null;
}
