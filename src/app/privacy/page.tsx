import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — Jesus Boot Camp",
  description:
    "How the Jesus Boot Camp collects, uses, and protects the information you share with us.",
};

export default function PrivacyPage() {
  return (
    <div className="bg-cream min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-grow pt-[120px] pb-20">
        <article className="max-w-[800px] mx-auto px-6">
          {/* Header */}
          <div className="text-center mb-14" data-aos="fade-up">
            <span className="inline-block px-4 py-1.5 border border-gold/20 rounded-full text-[11px] font-bold tracking-[0.2em] text-gold uppercase bg-gold/5 mb-6">
              Privacy
            </span>
            <h1 className="font-display text-4xl md:text-5xl font-bold text-navy tracking-tight max-w-[640px] mx-auto leading-[1.1] mb-6">
              Privacy Policy
            </h1>
            <div className="w-16 h-0.5 bg-gold/60 mx-auto rounded-full"></div>
            <p className="text-sm text-grey/60 mt-6">Last updated: May 29, 2026</p>
          </div>

          {/* Content */}
          <div
            className="max-w-[680px] mx-auto font-body text-[1.05rem] leading-[1.8] text-grey space-y-5"
            data-aos="fade-up"
            data-aos-delay="100"
          >
            <p>
              The Jesus Boot Camp (&ldquo;we,&rdquo; &ldquo;us&rdquo;) respects your
              privacy. This policy explains what information we collect when you use this
              website and how we use it.
            </p>

            <h2 className="font-display text-2xl font-bold text-navy pt-6">
              Information we collect
            </h2>
            <p>
              The only personal information we collect directly is the{" "}
              <strong className="text-navy">email address</strong> you choose to give us
              when you sign up to receive the course and handbook. We do not ask for your
              name, address, payment details, or any other personal information through
              this site.
            </p>

            <h2 className="font-display text-2xl font-bold text-navy pt-6">
              How we use it
            </h2>
            <p>
              We use your email address only to send you the discipleship sessions, the
              free handbook, and related updates from the Jesus Boot Camp. We do not sell,
              rent, or share your email address with third parties for their own marketing.
            </p>

            <h2 className="font-display text-2xl font-bold text-navy pt-6">
              Email service provider
            </h2>
            <p>
              We use Mailchimp to manage our email list and deliver messages. The email
              address you submit is stored securely with Mailchimp and handled according to
              their privacy practices.
            </p>

            <h2 className="font-display text-2xl font-bold text-navy pt-6">
              Unsubscribing
            </h2>
            <p>
              You can unsubscribe at any time using the link at the bottom of any email we
              send. Once you unsubscribe, we stop sending you messages and remove your
              address from our active list on request.
            </p>

            <h2 className="font-display text-2xl font-bold text-navy pt-6">Contact</h2>
            <p>
              If you have any questions about this policy or would like your information
              removed, please reach out to us through our{" "}
              <a
                href="https://www.skool.com/jesus-boot-camp-9143"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gold font-semibold underline decoration-gold/30 underline-offset-2 hover:decoration-gold"
              >
                community page
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
