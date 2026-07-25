import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Use — Jesus Boot Camp",
  description:
    "The terms that apply when you use the Jesus Boot Camp website, the free Handbook, and the discipleship training subscription.",
};

export default function TermsPage() {
  return (
    <div className="bg-cream min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-grow pt-[120px] pb-20">
        <article className="max-w-[800px] mx-auto px-6">
          {/* Header */}
          <div className="text-center mb-14" data-aos="fade-up">
            <span className="inline-block px-4 py-1.5 border border-gold/20 rounded-full text-[11px] font-bold tracking-[0.2em] text-gold uppercase bg-gold/5 mb-6">
              Terms
            </span>
            <h1 className="font-display text-4xl md:text-5xl font-bold text-navy tracking-tight max-w-[640px] mx-auto leading-[1.1] mb-6">
              Terms of Use
            </h1>
            <div className="w-16 h-0.5 bg-gold/60 mx-auto rounded-full"></div>
            <p className="text-sm text-grey/60 mt-6">Last updated: June 18, 2026</p>
          </div>

          {/* Content */}
          <div
            className="max-w-[680px] mx-auto font-body text-[1.05rem] leading-[1.8] text-grey space-y-5"
            data-aos="fade-up"
            data-aos-delay="100"
          >
            <p>
              These terms apply when you use the Jesus Boot Camp website and the
              resources we offer through it. By using this site, requesting the free
              Handbook, or joining the Boot Camp, you agree to these terms.
            </p>

            <h2 className="font-display text-2xl font-bold text-navy pt-6">
              The Handbook
            </h2>
            <p>
              The Handbook for a Disciple of Jesus is offered free of charge. You are
              welcome to download it, save it, and share it with others for personal,
              non-commercial discipleship use.
            </p>

            <h2 className="font-display text-2xl font-bold text-navy pt-6">
              The Boot Camp subscription
            </h2>
            <p>
              The Jesus Boot Camp is a 90-day discipleship training program. Your first
              three sessions are free with no credit card required. To continue beyond
              Session 3, the program is offered as a subscription of $25 per month, and
              you can cancel at any time. The training is delivered through our community
              platform, and billing is handled by that platform&apos;s payment processor
              under their own terms.
            </p>

            <h2 className="font-display text-2xl font-bold text-navy pt-6">
              One-time purchases
            </h2>
            <p>
              Any one-time products offered on this site (such as the &ldquo;Power for the
              Hour&rdquo; book) are sold and fulfilled through a third-party checkout.
              Payment, delivery, and refunds for those products are handled by that
              provider under their own terms.
            </p>

            <h2 className="font-display text-2xl font-bold text-navy pt-6">
              Use of our materials
            </h2>
            <p>
              The teaching, text, and design on this site are the work of Paul Joseph and
              the Jesus Boot Camp. You may use them for your own discipleship and to
              disciple others, but you may not resell or commercially redistribute the
              paid course materials without permission.
            </p>

            <h2 className="font-display text-2xl font-bold text-navy pt-6">
              Third-party services
            </h2>
            <p>
              We rely on trusted third parties to operate — including an email service
              provider, a community/course platform, and a payment processor. Your use of
              those services is also subject to their respective terms and privacy
              policies.
            </p>

            <h2 className="font-display text-2xl font-bold text-navy pt-6">
              Disclaimer
            </h2>
            <p>
              This site and its materials are provided for spiritual and educational
              purposes on an &ldquo;as is&rdquo; basis, without warranties of any kind. We
              are not liable for any loss arising from your use of the site or its
              resources.
            </p>

            <h2 className="font-display text-2xl font-bold text-navy pt-6">
              Changes to these terms
            </h2>
            <p>
              We may update these terms from time to time. Continued use of the site after
              an update means you accept the revised terms.
            </p>

            <h2 className="font-display text-2xl font-bold text-navy pt-6">Contact</h2>
            <p>
              If you have any questions about these terms, please reach out to us{" "}
              <a
                href="/join"
                className="text-gold font-semibold underline decoration-gold/30 underline-offset-2 hover:decoration-gold"
              >
                here
              </a>
              .
            </p>
          </div>
        </article>
      </main>

      <Footer />
    </div>
  );
}
