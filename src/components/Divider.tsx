import ScrollReveal from "@/components/ScrollReveal";

/**
 * The thin hairline that closes one chapter and opens the next.
 * Draws in (scaleX) as it enters the viewport instead of just sitting
 * there — the transition between major sections should feel like
 * turning a page, not pasting a rule.
 */
export default function Divider({ className = "" }: { className?: string }) {
  return (
    <ScrollReveal variant="line" className={className}>
      <div className="luxury-divider h-px w-full" />
    </ScrollReveal>
  );
}
