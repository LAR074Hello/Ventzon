import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Child Safety Standards — Ventzon",
  description:
    "Ventzon's child safety standards: our zero-tolerance policy on child sexual abuse and exploitation (CSAE) and child sexual abuse material (CSAM), how to report a concern, and how we respond.",
};

const UPDATED = "September 12, 2026";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="text-[20px] font-semibold tracking-[-0.01em] text-ink">{title}</h2>
      <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-muted">{children}</div>
    </section>
  );
}

export default function ChildSafetyPage() {
  return (
    <main className="marketing mx-auto min-h-screen max-w-2xl bg-bg px-6 pb-16 pt-28">
      <p className="text-[10px] font-semibold tracking-[0.14em] text-muted">VENTZON</p>
      <h1 className="mt-3 text-[32px] font-semibold tracking-[0.02em] text-ink">
        Child Safety Standards
      </h1>
      <p className="mt-3 text-[14px] text-muted">Last updated {UPDATED}</p>

      <p className="mt-8 text-[15px] leading-relaxed text-muted">
        Ventzon is for finding real local places and sharing what you actually
        experienced there. It is not a place for anything that harms a child.
        This page sets out our child-safety standards, how to report a concern,
        and how we respond to one.
      </p>

      <Section title="Zero tolerance for child sexual abuse and exploitation">
        <p>
          Ventzon has a <strong className="text-ink">zero-tolerance</strong>{" "}
          policy toward child sexual abuse and exploitation (CSAE) and child
          sexual abuse material (CSAM).
        </p>
        <p>
          Content or conduct that sexualizes, exploits, or endangers a minor is{" "}
          <strong className="text-ink">strictly prohibited</strong> on Ventzon,
          everywhere in the product. That covers everyone who uses it —
          customers, creators, merchants, and staff — and every surface: posts,
          photos, videos, comments, messages, display names, profiles, and shop
          pages.
        </p>
        <p>
          There is no context, intent, or artistic justification that makes CSAE
          or CSAM acceptable here.
        </p>
      </Section>

      <Section title="What is prohibited">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong className="text-ink">Child sexual abuse material (CSAM).</strong>{" "}
            Any image or video depicting a minor in a sexual or sexualized way.
            This includes material that is generated, altered, or synthesized —
            AI-generated content is treated exactly the same as any other.
          </li>
          <li>
            <strong className="text-ink">Grooming and sexual exploitation.</strong>{" "}
            Building a relationship with a minor in order to sexualize or abuse
            them, including sending sexual content, asking for it, or arranging
            to meet a minor for sexual purposes.
          </li>
          <li>
            <strong className="text-ink">Sexualization of minors.</strong> Sexual
            comments, roleplay, or content directed at a minor, or content that
            presents a minor as a sexual object.
          </li>
          <li>
            <strong className="text-ink">Sextortion and intimate images.</strong>{" "}
            Threatening to share, or sharing, intimate images of a minor —
            including synthesized images.
          </li>
          <li>
            <strong className="text-ink">Trafficking and endangerment.</strong>{" "}
            Advertising, facilitating, or promoting the sexual exploitation or
            trafficking of a minor.
          </li>
          <li>
            <strong className="text-ink">Anything unlawful.</strong> Any content
            or conduct that violates applicable child-safety laws.
          </li>
        </ul>
      </Section>

      <Section title="How to report a child-safety concern">
        <p>
          <strong className="text-ink">In the app — fastest.</strong> Open the
          &ldquo;&#8943;&rdquo; menu on any post, comment, or profile, choose{" "}
          <strong className="text-ink">Report</strong>, and pick the closest
          reason. Reported content is hidden immediately while we review it. The
          same controls are reachable from Settings, then Safety.
        </p>
        <p>
          <strong className="text-ink">By email.</strong> If you cannot report
          something in the app, or you want to escalate a report you have
          already made, email{" "}
          <a
            href="mailto:support@ventzon.com"
            className="text-ink underline underline-offset-2"
          >
            support@ventzon.com
          </a>
          . Include usernames, links, and anything else that helps us act
          quickly. You do not need a Ventzon account to email us.
        </p>
        <p>
          If a child is in immediate danger, contact your local emergency
          services first. Reports involving a child are our highest priority.
        </p>
      </Section>

      <Section title="How we respond">
        <p>
          When a report involves a child, we treat it as the most serious
          category of harm we handle. Depending on what we find, we:
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>remove the content;</li>
          <li>restrict or permanently terminate the accounts involved;</li>
          <li>preserve the relevant records and evidence;</li>
          <li>
            report to the National Center for Missing &amp; Exploited Children
            (NCMEC) through its CyberTipline, and to other relevant authorities,
            where the law requires it or where we believe a child is at risk;
          </li>
          <li>cooperate with law enforcement, including valid legal process.</li>
        </ul>
        <p>
          Severe violations result in an immediate permanent ban. No amount of
          reach, tenure, or account status exempts anyone from this.
        </p>
      </Section>

      <Section title="Compliance with child-safety laws">
        <p>
          Ventzon complies with the child-safety laws that apply to us,
          including laws prohibiting child sexual abuse material and the sexual
          exploitation of minors. Where the law requires us to report, preserve,
          remove, or restrict, we do it.
        </p>
        <p>
          This page describes our standards. It does not limit any legal
          obligation we have, and it applies alongside our{" "}
          <a href="/content-policy" className="text-ink underline underline-offset-2">
            Content Policy
          </a>{" "}
          and{" "}
          <a href="/terms" className="text-ink underline underline-offset-2">
            Terms of Service
          </a>
          .
        </p>
      </Section>

      <Section title="Contact for law enforcement and child-safety organizations">
        <p>
          Our point of contact for child-safety matters — for law enforcement,
          child-safety organizations, and regulators — is{" "}
          <a
            href="mailto:support@ventzon.com"
            className="text-ink underline underline-offset-2"
          >
            support@ventzon.com
          </a>
          .
        </p>
        <p>
          We respond to credible child-safety inquiries and to valid legal
          process, including preservation requests. If you need a designated
          recipient or a specific format, email that address and we will route
          it appropriately.
        </p>
      </Section>

      <div className="mt-14 border-t border-line pt-6">
        <p className="text-[14px] text-muted">
          Contact:{" "}
          <a
            href="mailto:support@ventzon.com"
            className="text-ink underline underline-offset-2"
          >
            support@ventzon.com
          </a>
          {" · "}
          <a href="/content-policy" className="text-ink underline underline-offset-2">
            Content Policy
          </a>
          {" · "}
          <a href="/terms" className="text-ink underline underline-offset-2">
            Terms
          </a>
          {" · "}
          <a href="/privacy" className="text-ink underline underline-offset-2">
            Privacy
          </a>
        </p>
      </div>
    </main>
  );
}
