import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Stats from "@/components/Stats";
import Problem from "@/components/Problem";
import Solution from "@/components/Solution";
import HowItWorks from "@/components/HowItWorks";
import BentoFeatures from "@/components/BentoFeatures";
import CoursePreview from "@/components/CoursePreview";
import Testimonials from "@/components/Testimonials";
import Handbook from "@/components/Handbook";
import About from "@/components/About";
import Pricing from "@/components/Pricing";
import FinalCTA from "@/components/FinalCTA";
import Footer from "@/components/Footer";

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://jesusbootcamp.org/#organization",
      name: "Jesus Boot Camp",
      url: "https://jesusbootcamp.org",
      logo: "https://jesusbootcamp.org/icon.jpg",
      founder: { "@type": "Person", name: "Paul Joseph" },
      description:
        "A 90-day discipleship training program that equips believers to become active, devoted disciples of Jesus Christ.",
    },
    {
      "@type": "Course",
      name: "The Jesus Boot Camp",
      description:
        "A structured 90-day discipleship training program. Your first 3 sessions are free, then $25/month to complete all 90 sessions.",
      url: "https://jesusbootcamp.org",
      provider: { "@id": "https://jesusbootcamp.org/#organization" },
      offers: {
        "@type": "Offer",
        category: "Subscription",
        price: "25",
        priceCurrency: "USD",
      },
      hasCourseInstance: {
        "@type": "CourseInstance",
        courseMode: "online",
        courseWorkload: "P90D",
      },
    },
  ],
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navbar />
      <Hero />
      <Stats />
      <Problem />
      <Solution />
      <HowItWorks />
      <BentoFeatures />
      <CoursePreview />
      <Testimonials />
      <Handbook />
      <About />
      <Pricing />
      <FinalCTA />
      <Footer />
    </>
  );
}
