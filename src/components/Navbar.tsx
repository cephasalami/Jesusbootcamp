"use client";

import { useState, useEffect } from "react";
import { Menu, X, ArrowRight } from "lucide-react";
import { JOIN_URL } from "@/config/links";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { href: "/#problem", label: "About" },
    { href: "/#how", label: "The Course" },
    { href: "/handbook", label: "The Handbook" },
    { href: "/why-the-boot-camp", label: "Why the Boot Camp?" },
    { href: "/blog", label: "Blog" },
    { href: "/#testimonials", label: "Testimonials" },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-[500] transition-all duration-500 ${
        scrolled
          ? "bg-cream/90 backdrop-blur-2xl border-b border-card-border shadow-[0_2px_32px_rgba(10,31,68,0.06)]"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="max-w-[1200px] mx-auto flex items-center justify-between px-6 sm:px-8 h-[76px]">
        {/* Brand wordmark (logo image removed — now used as the favicon) */}
        <a href="/" className="flex items-center gap-3 group shrink-0">
          <div className="font-display text-[1.15rem] font-bold text-navy tracking-tight leading-tight">
            JESUS<br />
            <span className="text-gold text-[0.9rem] font-semibold tracking-[0.1em]">BOOT CAMP</span>
          </div>
        </a>

        {/* Desktop Links */}
        <ul className="hidden lg:flex items-center gap-0 list-none">
          {links.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="relative block px-4 py-2 text-[13px] font-semibold text-grey transition-colors hover:text-navy group/link"
              >
                {link.label}
                <span className="absolute bottom-0 left-4 right-4 h-[1.5px] bg-gold scale-x-0 group-hover/link:scale-x-100 transition-transform duration-300 origin-left" />
              </a>
            </li>
          ))}
        </ul>

        {/* Right: CTA + Hamburger */}
        <div className="flex items-center gap-3">
          <a
            href={JOIN_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-2 bg-navy text-white text-[13px] font-bold px-5 py-[11px] rounded-sm transition-all duration-300 hover:bg-gold hover:text-navy group/cta whitespace-nowrap shadow-sm hover:shadow-[0_8px_20px_rgba(201,168,76,0.2)]"
          >
            Start Your Free Trial
            <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover/cta:translate-x-1" />
          </a>
          <button
            className="flex lg:hidden flex-col gap-[5px] p-2 bg-transparent border border-card-border rounded-md hover:border-navy/30 transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? (
              <X className="w-5 h-5 text-navy" />
            ) : (
              <Menu className="w-5 h-5 text-navy" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu — elegant drawer */}
      <div
        className={`lg:hidden bg-cream border-b border-card-border shadow-[0_8px_32px_rgba(10,31,68,0.08)] overflow-hidden transition-all duration-400 ${
          menuOpen ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="px-6 py-4">
          {links.map((link, i) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              style={{ transitionDelay: menuOpen ? `${i * 40}ms` : "0ms" }}
              className="flex items-center justify-between py-3.5 border-b border-card-border text-sm font-semibold text-grey hover:text-navy hover:pl-2 transition-all duration-200 last:border-b-0"
            >
              {link.label}
              <ArrowRight className="w-3.5 h-3.5 opacity-30" />
            </a>
          ))}
          <a
            href={JOIN_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setMenuOpen(false)}
            className="flex items-center justify-center gap-2 mt-4 bg-navy text-white text-sm font-bold py-4 rounded-sm hover:bg-gold hover:text-navy transition-all duration-300"
          >
            Start Your Free Trial <ArrowRight className="w-4 h-4" />
          </a>
          <p className="text-[12px] italic text-grey text-center mt-3">
            First 3 sessions free
          </p>
        </div>
      </div>
    </nav>
  );
}


