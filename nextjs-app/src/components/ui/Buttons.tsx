export function SectionTag({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-2 bg-gold/10 text-gold text-xs font-semibold tracking-[0.12em] uppercase px-5 py-2 rounded-full border border-gold/25 ${className}`}
    >
      {children}
    </span>
  );
}

export function ButtonGold({
  children,
  href = "#cta-final",
  className = "",
}: {
  children: React.ReactNode;
  href?: string;
  className?: string;
}) {
  return (
    <a
      href={href}
      className={`inline-flex items-center gap-2 bg-gold text-navy text-[15px] font-bold px-8 py-4 rounded-xl border-none transition-all duration-250 shadow-[0_2px_12px_rgba(201,168,76,0.3)] hover:bg-gold-light hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(201,168,76,0.35)] ${className}`}
    >
      {children}
    </a>
  );
}

export function ButtonOutline({
  children,
  href = "#how",
  className = "",
}: {
  children: React.ReactNode;
  href?: string;
  className?: string;
}) {
  return (
    <a
      href={href}
      className={`inline-flex items-center gap-2 bg-transparent text-navy text-[15px] font-semibold px-8 py-[15px] rounded-xl border-2 border-navy transition-all duration-250 hover:bg-navy hover:text-cream ${className}`}
    >
      {children}
    </a>
  );
}
