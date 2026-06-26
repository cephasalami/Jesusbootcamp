import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PortableText, type PortableTextComponents } from "@portabletext/react";
import type { SanityImageSource } from "@sanity/image-url";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getPost, getPostSlugs } from "@/sanity/lib/posts";
import { urlForImage } from "@/sanity/lib/image";

export const revalidate = 60;

export async function generateStaticParams() {
  const slugs = await getPostSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: "Post not found — Jesus Boot Camp" };
  return {
    title: `${post.title} — Jesus Boot Camp`,
    description: post.excerpt,
    alternates: { canonical: `/blog/${slug}` },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      ...(post.mainImage
        ? { images: [urlForImage(post.mainImage)?.width(1200).height(630).fit("crop").url() ?? ""] }
        : {}),
    },
  };
}

function formatDate(value?: string) {
  if (!value) return "";
  try {
    return new Date(value).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

const portableComponents: PortableTextComponents = {
  types: {
    image: ({ value }: { value: SanityImageSource }) => {
      const url = urlForImage(value)?.width(1400).fit("max").url();
      if (!url) return null;
      return (
        <span className="block my-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt="" className="w-full rounded-xl" />
        </span>
      );
    },
  },
  block: {
    h2: ({ children }) => (
      <h2 className="font-display text-2xl md:text-3xl font-bold text-navy tracking-tight mt-12 mb-4">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="font-display text-xl md:text-2xl font-bold text-navy tracking-tight mt-10 mb-3">
        {children}
      </h3>
    ),
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-gold/50 pl-5 my-8 italic text-navy/80 text-[1.15rem]">
        {children}
      </blockquote>
    ),
    normal: ({ children }) => (
      <p className="text-[1.075rem] leading-[1.85] text-grey mb-5">{children}</p>
    ),
  },
  marks: {
    link: ({ value, children }) => {
      const href = value?.href ?? "#";
      const external = /^https?:\/\//.test(href);
      return (
        <a
          href={href}
          {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          className="text-gold font-semibold underline decoration-gold/30 underline-offset-2 hover:decoration-gold"
        >
          {children}
        </a>
      );
    },
    strong: ({ children }) => <strong className="text-navy font-bold">{children}</strong>,
  },
  list: {
    bullet: ({ children }) => (
      <ul className="list-disc pl-6 mb-6 space-y-2 text-[1.075rem] leading-[1.8] text-grey">
        {children}
      </ul>
    ),
    number: ({ children }) => (
      <ol className="list-decimal pl-6 mb-6 space-y-2 text-[1.075rem] leading-[1.8] text-grey">
        {children}
      </ol>
    ),
  },
};

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  const heroImg = post.mainImage
    ? urlForImage(post.mainImage)?.width(1400).height(750).fit("crop").url()
    : null;

  return (
    <div className="bg-cream min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-grow pt-[120px] pb-24 px-5 sm:px-8">
        <article className="max-w-[760px] mx-auto">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-[14px] font-bold text-navy hover:text-gold transition-colors mb-8 group"
          >
            <ArrowLeft className="w-4 h-4 text-gold transition-transform group-hover:-translate-x-1" />
            All posts
          </Link>

          <div className="mb-8" data-aos="fade-up">
            {post.publishedAt && (
              <span className="text-[12px] font-bold uppercase tracking-[0.15em] text-gold">
                {formatDate(post.publishedAt)}
                {post.authorName ? ` · ${post.authorName}` : ""}
              </span>
            )}
            <h1 className="font-display text-3xl md:text-5xl font-bold text-navy tracking-tight leading-[1.1] mt-4">
              {post.title}
            </h1>
          </div>

          {heroImg && (
            <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden shadow-lg mb-12">
              <Image
                src={heroImg}
                alt={post.title}
                fill
                priority
                sizes="(max-width: 768px) 100vw, 760px"
                className="object-cover"
              />
            </div>
          )}

          <div className="font-body">
            {post.body ? (
              <PortableText value={post.body} components={portableComponents} />
            ) : (
              post.excerpt && (
                <p className="text-[1.075rem] leading-[1.85] text-grey">{post.excerpt}</p>
              )
            )}
          </div>
        </article>
      </main>

      <Footer />
    </div>
  );
}
