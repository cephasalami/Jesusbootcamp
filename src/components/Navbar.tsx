"use client";

import { useState, useEffect } from "react";
import { Cross, Menu, X } from "lucide-react";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { href: "#problem", label: "About" },
    { href: "#how", label: "The Course" },
    { href: "#handbook", label: "The Handbook" },
    { href: "#testimonials", label: "Testimonials" },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-[500] bg-cream/85 backdrop-blur-2xl transition-all duration-300 ${
        scrolled ? "border-b border-card-border shadow-[0_1px_24px_rgba(10,31,68,0.06)]" : "border-b border-transparent"
      }`}
    >
      <div className="max-w-[1200px] mx-auto flex items-center justify-between px-8 h-[72px]">
        {/* Logo */}
        <a href="#" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-navy rounded-[10px] flex items-center justify-center text-lg">
            ✝️
          </div>
          <div className="font-display text-[1.05rem] font-bold text-navy tracking-[0.02em]">
            THE JESUS BOOT CAMP
          </div>
        </a>

        {/* Desktop Links */}
        <ul className="hidden md:flex items-center gap-0 list-none">
          {links.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="block px-5 text-sm font-medium text-grey transition-colors hover:text-navy"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        {/* Right */}
        <div className="flex items-center gap-3">
          <a
            href="#cta-final"
            className="hidden sm:block bg-gold text-navy text-[13.5px] font-bold px-[22px] py-[11px] rounded-[10px] transition-colors hover:bg-gold-light whitespace-nowrap"
          >
            Join Free — Start Today
          </a>
          <button
            className="flex md:hidden flex-col gap-[5px] p-1 bg-transparent border-none"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? (
              <X className="w-6 h-6 text-navy" />
            ) : (
              <Menu className="w-6 h-6 text-navy" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden bg-cream border-b border-card-border px-8 pb-4 shadow-[0_8px_24px_rgba(10,31,68,0.08)]">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="block py-3 border-b border-card-border text-sm font-medium text-grey hover:text-navy last:border-b-0"
            >
              {link.label}
            </a>
          ))}
          <a
            href="#cta-final"
            onClick={() => setMenuOpen(false)}
            className="block mt-3 bg-gold text-navy text-center text-sm font-bold py-3 rounded-xl"
          >
            Join Free — Start Today
          </a>
        </div>
      )}
    </nav>
  );
}
