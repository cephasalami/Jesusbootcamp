const links = [
  { href: "#problem", label: "About" },
  { href: "#how", label: "The Course" },
  { href: "#handbook", label: "The Handbook" },
  { href: "#testimonials", label: "Testimonials" },
  { href: "#cta-final", label: "Join Free" },
];

export default function Footer() {
  return (
    <footer className="bg-cream border-t border-card-border py-20 px-8" data-aos="fade-up">
      <div className="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
        {/* Logo & About */}
        <div className="md:col-span-2">
          <div className="font-display text-[1.2rem] font-bold text-navy tracking-tight mb-6">
            JESUS BOOT CAMP
          </div>
          <p className="text-[0.95rem] text-grey leading-[1.7] max-w-[380px]">
            A free 90-day discipleship journey designed to move you from dormant
            believer to disciplined ambassador of Christ.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="font-sans text-[12px] font-bold uppercase tracking-[0.15em] text-navy mb-6">Navigation</h4>
          <div className="flex flex-col gap-4">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm text-grey hover:text-gold transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>

        {/* Legal */}
        <div>
          <h4 className="font-sans text-[12px] font-bold uppercase tracking-[0.15em] text-navy mb-6">Legal</h4>
          <div className="flex flex-col gap-4">
            <a href="#" className="text-sm text-grey hover:text-gold transition-colors">Privacy Policy</a>
            <a href="#" className="text-sm text-grey hover:text-gold transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto pt-10 border-t border-card-border flex flex-col md:flex-row justify-between items-center gap-6">
        <p className="text-[13px] text-grey/60">
          © 2025 Jesus Boot Camp — A Ministry of Paul Joseph.
        </p>
        <p className="text-[13px] text-grey/60">
          Built for the Mission.
        </p>
      </div>
    </footer>
  );
}
