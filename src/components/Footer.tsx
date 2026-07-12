import Image from "next/image";
import { Sparkles, ArrowUpRight } from "lucide-react";
import { JOIN_URL } from "@/config/links";

const links = [
  { href: "/#problem", label: "About" },
  { href: "/#how", label: "The Course" },
  { href: "/handbook", label: "The Handbook" },
  { href: "/why-the-boot-camp", label: "Why the Boot Camp?" },
  { href: "/blog", label: "Blog" },
  { href: "/#testimonials", label: "Testimonials" },
  { href: JOIN_URL, label: "Get Started", external: true },
];

export default function Footer() {
  return (
    <footer className="bg-[#111111] text-white/70 border-t border-white/5 py-24 px-6 sm:px-8 relative overflow-hidden" data-aos="fade-up">
      {/* Dynamic background glow */}
      <div className="absolute bottom-0 right-0 w-[30vw] h-[30vw] bg-gold/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-16 mb-20 relative z-10">
        
        {/* Logo & Vision Block */}
        <div className="md:col-span-2 space-y-6">
          <div className="flex items-center gap-4">
            <div className="relative group">
              <div className="absolute inset-0 bg-gold/20 rounded-full blur-md" />
              <Image
                src="/images/photo_2026-05-20_20-17-44.jpg"
                alt="Jesus Boot Camp Logo"
                width={76}
                height={76}
                className="rounded-full object-cover border border-gold/30 relative z-10 shadow-lg"
              />
            </div>
            
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-gold tracking-[0.25em] uppercase mb-0.5 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Remnant Vision
              </span>
              <div className="font-display text-[1.35rem] font-bold text-white tracking-tight leading-tight">
                JESUS BOOT CAMP
              </div>
            </div>
          </div>

          <p className="text-[0.95rem] text-white/50 leading-[1.8] max-w-[400px]">
            A comprehensive 90-day discipleship journey designed to move you to an active
            ambassador of Jesus Christ.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="text-[11px] font-bold uppercase tracking-[0.2em] !text-white mb-6 border-l-2 border-gold/60 pl-3">
            Navigation
          </h4>
          <div className="flex flex-col gap-3.5">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                {...(link.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                className="text-[14px] text-white/50 hover:text-gold hover:pl-1 transition-all duration-200 flex items-center gap-1 group"
              >
                <span>{link.label}</span>
                <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
            ))}
          </div>
        </div>

        {/* Legal / Resources */}
        <div>
          <h4 className="text-[11px] font-bold uppercase tracking-[0.2em] !text-white mb-6 border-l-2 border-gold/60 pl-3">
            Resources
          </h4>
          <div className="flex flex-col gap-3.5">
            <a href="/handbook" className="text-[14px] text-white/50 hover:text-gold hover:pl-1 transition-all duration-200">The Handbook PDF</a>
            <a href="/why-the-boot-camp" className="text-[14px] text-white/50 hover:text-gold hover:pl-1 transition-all duration-200">Why the Boot Camp</a>
            <a href="/privacy" className="text-[14px] text-white/50 hover:text-gold hover:pl-1 transition-all duration-200">Privacy Policy</a>
          </div>
        </div>
      </div>

      {/* Footer Bottom bar */}
      <div className="max-w-[1200px] mx-auto pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 relative z-10">
        <p className="text-[13px] text-white/40 font-medium">
          © {new Date().getFullYear()} Jesus Boot Camp — A Discipleship Ministry of Paul Joseph.
        </p>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-gold animate-pulse" />
          <p className="text-[13px] text-gold/80 font-bold tracking-wider uppercase">
            Built for the Great Commission
          </p>
        </div>
      </div>
    </footer>
  );
}
