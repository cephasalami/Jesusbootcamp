import type { PortableTextBlock } from "@portabletext/react";
import type { SanityImageSource } from "@sanity/image-url";
import { client } from "./client";
import { postsQuery, postBySlugQuery, postSlugsQuery } from "./queries";

export type PostListItem = {
  _id: string;
  title: string;
  slug: string;
  excerpt?: string;
  publishedAt?: string;
  mainImage?: SanityImageSource;
  authorName?: string;
};

export type Post = PostListItem & {
  body?: PortableTextBlock[];
};

export async function getPosts(): Promise<PostListItem[]> {
  if (!client) return [];
  try {
    return await client.fetch(postsQuery, {}, { next: { revalidate: 60 } });
  } catch {
    return [];
  }
}

export async function getPostSlugs(): Promise<string[]> {
  if (!client) return [];
  try {
    const rows: { slug: string }[] = await client.fetch(postSlugsQuery);
    return rows.map((r) => r.slug).filter(Boolean);
  } catch {
    return [];
  }
}

export async function getPost(slug: string): Promise<Post | null> {
  if (!client) return null;
  try {
    return await client.fetch(
      postBySlugQuery,
      { slug },
      { next: { revalidate: 60 } }
    );
  } catch {
    return null;
  }
}
