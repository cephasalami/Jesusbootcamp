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
import LeadMagnet from "@/components/LeadMagnet";
import Upsell from "@/components/Upsell";
import FinalCTA from "@/components/FinalCTA";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <Hero />
      <Stats />
      <Problem />
      <Solution />
      <HowItWorks />
      <BentoFeatures />
      <CoursePreview />
      {/* <Testimonials /> */}
      {/* TODO: Replace with real testimonials when available. Do not publish placeholder names — Paul's instructions. */}
      <Handbook />
      <About />
      <LeadMagnet />
      <Upsell />
      <FinalCTA />
      <Footer />
    </>
  );
}
