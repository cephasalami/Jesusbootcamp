const links = [
  { href: "#problem", label: "About" },
  { href: "#how", label: "The Course" },
  { href: "#handbook", label: "The Handbook" },
  { href: "#testimonials", label: "Testimonials" },
  { href: "#cta-final", label: "Join Free" },
];

export default function Footer() {
  return (
    <footer className="bg-cream border-t border-card-border py-14 px-8">
      <div className="max-w-[1100px] mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-navy rounded-[9px] flex items-center justify-center text-[15px]">
            ✝️
          </div>
          <div className="font-display text-[0.95rem] font-bold text-navy">
            The Jesus Boot Camp
          </div>
        </div>

        {/* Links */}
        <div className="flex gap-8 flex-wrap">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-grey transition-colors hover:text-navy"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Socials removed temporarily */}
      </div>

      {/* Bottom */}
      <div className="max-w-[1100px] mx-auto mt-8 pt-6 border-t border-card-border flex flex-col sm:flex-row justify-between items-center gap-4">
        <p className="text-xs text-grey">
          © 2025 The Jesus Boot Camp — A Ministry of Paul Joseph
        </p>
        <p className="text-xs text-grey">
          <a href="#" className="underline underline-offset-2">
            Privacy Policy
          </a>{" "}
          ·{" "}
          <a href="#" className="underline underline-offset-2">
            Terms
          </a>
        </p>
      </div>
    </footer>
  );
}
