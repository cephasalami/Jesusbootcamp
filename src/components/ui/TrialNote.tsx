// Standard supporting microcopy shown beneath Boot Camp trial CTAs.
// Inter, 13px, italic, #5C5C5C (text-grey). Centered by default.
export default function TrialNote({
  text = "First 3 sessions free",
  className = "",
}: {
  text?: string;
  className?: string;
}) {
  return (
    <p className={`font-body text-[13px] italic text-grey ${className}`}>
      {text}
    </p>
  );
}
