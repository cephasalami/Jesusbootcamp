import { SectionTag } from "./ui/Buttons";
import Image from "next/image";
import { ArrowRight, Play, Award, Sparkles } from "lucide-react";
import { JOIN_URL } from "@/config/links";

export default function Hero() {
  return (
    <section
      id="hero"
      className="pt-[140px] pb-20 sm:pt-[180px] sm:pb-32 px-5 sm:px-8 bg-gradient-to-b from-[#F5F0E8] via-[#F7F3EB] to-[#EDEAE2] overflow-hidden relative"
    >
      {/* Background glow accents */}
      <div className="absolute top-[10%] left-[-10%] w-[35vw] h-[35vw] bg-gold/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[10%] right-[-10%] w-[40vw] h-[40vw] bg-gold/5 blur-[150px] rounded-full pointer-events-none" />

      <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-[1.25fr_0.75fr] gap-12 lg:gap-20 items-center relative z-10">
        {/* Left Column Content */}
        <div data-aos="fade-up" data-aos-duration="1000" className="flex flex-col">
          {/* Elegant Crest/Logo presentation */}
          <div className="flex items-center gap-4 mb-8">
            <div className="relative group shrink-0">
              <div className="absolute inset-0 bg-gold/20 rounded-full blur-md group-hover:bg-gold/30 transition-all duration-500" />
              <div className="relative p-1 border border-gold/40 rounded-full bg-cream shadow-xl hover:rotate-12 transition-transform duration-500">
                <Image
                  src="/images/photo_2026-05-20_20-17-44.jpg"
                  alt="Jesus Boot Camp Logo"
                  width={96}
                  height={96}
                  className="rounded-full object-cover"
                  priority
                />
              </div>
            </div>
            
            <div className="flex flex-col justify-center">
              <span className="text-[12px] font-bold text-gold tracking-[0.25em] uppercase mb-1 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Course Launch
              </span>
              <h1 className="font-display text-[clamp(2.2rem,5vw,3.5rem)] font-bold leading-none text-navy tracking-tight">
                The Jesus Boot Camp
              </h1>
            </div>
          </div>

          {/* Premium Tagline Badge */}
          <div className="self-start mb-6">
            <span className="inline-flex items-center gap-2 bg-[#EDEAE2] text-navy/80 text-[11px] font-bold tracking-[0.2em] uppercase px-5 py-2.5 rounded-full border border-card-border shadow-sm">
              Three-Month Discipleship Course
            </span>
          </div>

          {/* Main Editorial Headline */}
          <h2 className="font-display text-[clamp(1.8rem,4vw,2.65rem)] font-bold leading-[1.25] text-navy mb-6 tracking-tight max-w-[720px]">
            Become an active disciple of Jesus in only <span className="italic font-normal text-gold relative inline-block">three months<span className="absolute bottom-1 left-0 w-full h-[2px] bg-gold/20" /></span> of training in the Word
          </h2>

          {/* Elevated Paragraph Copy */}
          <p className="text-[1.05rem] sm:text-[1.18rem] text-grey/90 leading-[1.85] max-w-[620px] mb-12 font-medium">
            Once you learn to be a disciple, you, in turn, can disciple others—and that is fulfilling the <strong className="text-navy font-bold">Great Commission</strong>.
          </p>

          {/* High-end Premium CTA Button */}
          <div className="flex items-center gap-4 flex-wrap">
            <a
              href={JOIN_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-3 bg-navy text-white text-[15px] sm:text-[16px] font-bold px-10 py-5 rounded-none border border-navy/20 transition-all duration-350 shadow-[0_10px_30px_rgba(26,26,26,0.12)] hover:bg-gold hover:text-navy hover:-translate-y-1 hover:shadow-[0_15px_35px_rgba(201,168,76,0.25)] group relative overflow-hidden active:translate-y-0"
            >
              {/* Subtle shining light sweep effect on hover */}
              <div className="absolute top-0 -left-[100%] w-[50%] h-full bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:animate-[shimmer_1.5s_infinite] pointer-events-none" />
              <span>Join the Jesus boot camp</span>
              <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1.5" />
            </a>
          </div>
        </div>

        {/* Right Column Visual — Visual Masterpiece */}
        <div className="relative mt-8 lg:mt-0" data-aos="fade-left" data-aos-duration="1200">
          {/* Glowing backplate */}
          <div className="absolute -inset-4 bg-gold/5 rounded-[40px] blur-2xl pointer-events-none" />

          {/* Main portrait wrapper */}
          <div className="aspect-[4/5] w-full max-w-[430px] mx-auto bg-warm rounded-2xl overflow-hidden relative shadow-[0_30px_80px_rgba(0,0,0,0.08)] border border-card-border/50 group">
            <Image
              src="/images/paul-joseph.jpg"
              alt="Paul Joseph"
              fill
              className="object-cover grayscale-[0.1] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-1000"
              sizes="(max-width: 1024px) 100vw, 400px"
              priority
            />
            {/* Elegant dark vignette overlay on bottom */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-90 transition-opacity duration-500" />
            
            {/* Floating glassmorphic stats badge in image */}
            <div className="absolute bottom-6 left-6 right-6 backdrop-blur-md bg-white/10 border border-white/20 p-5 rounded-xl shadow-2xl flex items-center justify-between transition-transform duration-500 group-hover:translate-y-[-4px]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gold/90 flex items-center justify-center text-navy shadow-lg">
                  <Play className="w-4 h-4 fill-navy text-navy pl-0.5" />
                </div>
                <div>
                  <p className="text-[11px] font-bold tracking-widest text-white/70 uppercase">Led by</p>
                  <p className="text-[15px] font-bold text-white leading-tight">Paul Joseph</p>
                </div>
              </div>
              <div className="flex flex-col items-end border-l border-white/20 pl-4 text-right">
                <p className="text-[11px] font-bold tracking-widest text-white/70 uppercase">Format</p>
                <p className="text-[13px] font-bold text-gold">Audio, Video & PPT</p>
              </div>
            </div>
          </div>
          
          {/* Outer floating golden crest */}
          <div className="absolute -top-6 -right-6 w-20 h-20 bg-gold text-navy rounded-full flex flex-col items-center justify-center shadow-2xl border-4 border-cream rotate-12 hover:rotate-0 transition-transform duration-500 pointer-events-none">
            <Award className="w-7 h-7" />
            <span className="text-[9px] font-extrabold tracking-wider uppercase mt-0.5">90 DAYS</span>
          </div>

          {/* Elegant geometric frame lines */}
          <div className="absolute -bottom-6 -left-6 w-36 h-36 border-l-2 border-b-2 border-gold/30 rounded-bl-3xl pointer-events-none" />
        </div>
      </div>
    </section>
  );
}
