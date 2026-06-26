import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { ArrowUpRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getPosts } from "@/sanity/lib/posts";
import { urlForImage } from "@/sanity/lib/image";

export const metadata: Metadata = {
  title: "Blog — Jesus Boot Camp",
  description:
    "Teaching, encouragement, and updates from Paul Joseph and the Jesus Boot Camp.",
  alternates: { canonical: "/blog" },
};

// Revalidate the list every 60s so new posts appear without a redeploy.
export const revalidate = 60;

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

export default async function BlogPage() {
  const posts = await getPosts();

  return (
    <div className="bg-cream min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-grow pt-[120px] pb-24 px-5 sm:px-8">
        <div className="max-w-[1100px] mx-auto">
          {/* Header */}
          <div className="text-center mb-16" data-aos="fade-up">
            <span className="inline-block px-4 py-1.5 border border-gold/20 rounded-full text-[11px] font-bold tracking-[0.2em] text-gold uppercase bg-gold/5 mb-6">
              The Blog
            </span>
            <h1 className="font-display text-4xl md:text-5xl font-bold text-navy tracking-tight leading-[1.1] mb-5">
              Teaching &amp; Encouragement
            </h1>
            <p className="text-[1.1rem] text-grey max-w-[560px] mx-auto leading-[1.7]">
              Insights from the Word, discipleship encouragement, and the latest
              from the Jesus Boot Camp.
            </p>
          </div>

          {posts.length === 0 ? (
            <div className="max-w-[560px] mx-auto text-center bg-white border border-card-border rounded-2xl p-12 shadow-sm">
              <h2 className="font-display text-2xl font-bold text-navy mb-3">
                Posts are coming soon
              </h2>
              <p className="text-grey leading-[1.7]">
                The first articles are on their way. Check back shortly — or{" "}
                <Link href="/handbook" className="text-gold font-semibold underline decoration-gold/30 underline-offset-2 hover:decoration-gold">
                  grab the free Handbook
                </Link>{" "}
                in the meantime.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.map((post, i) => {
                const img = post.mainImage
                  ? urlForImage(post.mainImage)?.width(800).height(500).fit("crop").url()
                  : null;
                return (
                  <Link
                    key={post._id}
                    href={`/blog/${post.slug}`}
                    data-aos="fade-up"
                    data-aos-delay={(i % 3) * 100}
                    className="group bg-white border border-card-border rounded-2xl overflow-hidden flex flex-col transition-all duration-500 hover:shadow-xl hover:-translate-y-1"
                  >
                    <div className="relative aspect-[16/10] bg-cream overflow-hidden">
                      {img ? (
                        <Image
                          src={img}
                          alt={post.title}
                          fill
                          sizes="(max-width: 768px) 100vw, 33vw"
                          className="object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-cream to-[#EDEAE2]" />
                      )}
                    </div>
                    <div className="flex flex-col flex-1 p-7">
                      {post.publishedAt && (
                        <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-gold mb-3">
                          {formatDate(post.publishedAt)}
                        </span>
                      )}
                      <h2 className="font-display text-[1.35rem] font-bold text-navy leading-snug tracking-tight mb-3">
                        {post.title}
                      </h2>
                      {post.excerpt && (
                        <p className="text-[14px] text-grey leading-[1.7] mb-5 flex-1">
                          {post.excerpt}
                        </p>
                      )}
                      <span className="mt-auto inline-flex items-center gap-1.5 text-[14px] font-bold text-navy group-hover:text-gold transition-colors">
                        Read more
                        <ArrowUpRight className="w-4 h-4 text-gold transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
