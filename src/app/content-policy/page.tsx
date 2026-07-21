import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Content Policy — Ventzon",
  description:
    "The rules for posts, comments, and profiles on Ventzon, and how to report content or block an account.",
};

const UPDATED = "July 20, 2026";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="text-[20px] font-semibold tracking-[-0.01em] text-ink">{title}</h2>
      <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-muted">{children}</div>
    </section>
  );
}

export default function ContentPolicyPage() {
  return (
    <main className="mx-auto min-h-screen max-w-2xl bg-bg px-6 pb-16 pt-28">
      <p className="text-[10px] font-semibold tracking-[0.14em] text-muted">VENTZON</p>
      <h1 className="mt-3 text-[32px] font-semibold tracking-[-0.02em] text-ink">
        Content Policy
      </h1>
      <p className="mt-3 text-[14px] text-muted">Last updated {UPDATED}</p>

      <p className="mt-8 text-[15px] leading-relaxed text-muted">
        Ventzon is for finding real local places and sharing what you actually
        experienced there. These rules keep it that way. They apply to every
        post, comment, photo, display name, and profile on Ventzon.
      </p>

      <Section title="What belongs here">
        <p>
          Posts about real businesses you&rsquo;ve visited — the food, the cut,
          the class, the shop. Photos you took. Honest opinions, including
          critical ones.
        </p>
      </Section>

      <Section title="What isn't allowed">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong className="text-ink">Harassment or hate.</strong> Attacks on
            people or groups based on race, ethnicity, national origin,
            religion, disability, sex, gender identity, sexual orientation, or
            age. No bullying, threats, or targeted pile-ons.
          </li>
          <li>
            <strong className="text-ink">Sexual content.</strong> Nudity or
            sexually explicit material. Absolutely no sexual content involving
            minors — we report it to law enforcement and ban permanently.
          </li>
          <li>
            <strong className="text-ink">Violence and dangerous acts.</strong>{" "}
            Graphic violence, threats, or promotion of self-harm.
          </li>
          <li>
            <strong className="text-ink">Illegal goods.</strong> Drugs, weapons,
            counterfeits, or stolen property.
          </li>
          <li>
            <strong className="text-ink">Other people&rsquo;s privacy.</strong>{" "}
            Home addresses, phone numbers, or photos of people who didn&rsquo;t
            agree to be posted. (Ventzon strips location data from uploaded
            photos automatically, but don&rsquo;t post what isn&rsquo;t yours to
            share.)
          </li>
          <li>
            <strong className="text-ink">Spam and fakery.</strong> Bulk or
            repetitive posting, engagement farming, fake reviews, undisclosed
            paid promotion, or impersonating a person or business.
          </li>
          <li>
            <strong className="text-ink">Content you don&rsquo;t own.</strong>{" "}
            Photos or writing copied from someone else.
          </li>
        </ul>
      </Section>

      <Section title="Reporting and blocking">
        <p>
          Every post, comment, and profile has a &ldquo;⋯&rdquo; menu with{" "}
          <strong className="text-ink">Report</strong> and{" "}
          <strong className="text-ink">Block</strong>.
        </p>
        <p>
          Reported posts and comments are hidden immediately while they&rsquo;re
          reviewed — usually within 24 hours. Blocking is mutual: you and that
          account stop seeing each other&rsquo;s posts, comments, and profiles,
          and any follow between you is removed. You can unblock any time in
          Settings → Safety.
        </p>
      </Section>

      <Section title="What happens when we act">
        <p>
          Depending on severity, we remove the content, restrict the account, or
          ban it permanently. Severe violations — especially anything involving
          minors — result in an immediate permanent ban and, where required, a
          report to the relevant authorities.
        </p>
        <p>
          If you think we got it wrong, email{" "}
          <a
            href="mailto:support@ventzon.com"
            className="text-ink underline underline-offset-2"
          >
            support@ventzon.com
          </a>{" "}
          and we&rsquo;ll take another look.
        </p>
      </Section>

      <Section title="Your content and your account">
        <p>
          You own what you post. You can delete any post or comment you made,
          and deleting your account in Settings permanently removes your
          profile, posts, photos, comments, likes, and follows.
        </p>
      </Section>

      <div className="mt-14 border-t border-line pt-6">
        <p className="text-[14px] text-muted">
          Questions:{" "}
          <a
            href="mailto:support@ventzon.com"
            className="text-ink underline underline-offset-2"
          >
            support@ventzon.com
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
