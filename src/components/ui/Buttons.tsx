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

// Links to other sites open in a new tab with safe rel attributes.
const externalProps = (href: string) =>
  /^https?:\/\//.test(href)
    ? { target: "_blank", rel: "noopener noreferrer" }
    : {};

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
      {...externalProps(href)}
      className={`inline-flex items-center gap-2 bg-navy text-white text-[15px] font-bold px-8 py-4 rounded-sm border-none transition-all duration-250 hover:bg-gold hover:text-navy hover:-translate-y-0.5 ${className}`}
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
      {...externalProps(href)}
      className={`inline-flex items-center gap-2 bg-transparent text-navy text-[15px] font-semibold px-8 py-[15px] rounded-sm border-2 border-navy transition-all duration-250 hover:bg-navy hover:text-white ${className}`}
    >
      {children}
    </a>
  );
}
