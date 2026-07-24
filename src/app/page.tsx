import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Problem from "@/components/Problem";
import Mission from "@/components/Mission";
import Solution from "@/components/Solution";
import InsideSessions from "@/components/InsideSessions";
import CoursePreview from "@/components/CoursePreview";
import Community from "@/components/Community";
import HowItWorks from "@/components/HowItWorks";
import About from "@/components/About";
import EnlistBanner from "@/components/EnlistBanner";
import JoinBanner from "@/components/JoinBanner";
import PartnerCTA from "@/components/PartnerCTA";
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
        "A structured 90-day discipleship training program.",
      url: "https://jesusbootcamp.org",
      provider: { "@id": "https://jesusbootcamp.org/#organization" },
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
      <Problem />
      <Mission />
      <Solution />
      <InsideSessions />
      <CoursePreview />
      <EnlistBanner />
      <Community />
      <HowItWorks />
      <About />
      <JoinBanner />
      <PartnerCTA variant="long" />
      <FinalCTA />
      <Footer />
    </>
  );
}
