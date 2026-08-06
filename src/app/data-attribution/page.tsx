import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Data & Licences — Ventzon",
  description:
    "Where Ventzon's place data comes from, how OpenStreetMap is credited, and how to obtain the imported place data under the Open Database License.",
};

const UPDATED = "August 1, 2026";

const OSM_COPYRIGHT = "https://www.openstreetmap.org/copyright";
const ODBL = "https://opendatacommons.org/licenses/odbl/1-0/";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="text-[20px] font-semibold tracking-[-0.01em] text-ink">{title}</h2>
      <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-muted">{children}</div>
    </section>
  );
}

function A({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-ink underline underline-offset-2"
    >
      {children}
    </a>
  );
}

/**
 * The attribution anchor.
 *
 * ODbL requires credit wherever OpenStreetMap data is displayed. Crediting
 * every place name in the feed individually would be absurd, and the OSMF
 * guidelines do not ask for it — they ask for attribution that is reasonably
 * prominent and reachable from where the data appears. The map and every place
 * page carry the credit inline; this page is what those lean on, and it is
 * where the licence is actually named.
 */
export default function DataAttributionPage() {
  return (
    <main className="marketing mx-auto min-h-screen max-w-2xl bg-bg px-6 pb-16 pt-28">
      <p className="text-[10px] font-semibold tracking-[0.14em] text-muted">VENTZON</p>
      <h1 className="mt-3 text-[32px] font-semibold tracking-[0.02em] text-ink">
        Data &amp; Licences
      </h1>
      <p className="mt-3 text-[14px] text-muted">Last updated {UPDATED}</p>

      <p className="mt-8 text-[15px] leading-relaxed text-muted">
        Most of the places you can find on Ventzon were not entered by us. They
        come from <A href="https://www.openstreetmap.org/">OpenStreetMap</A>, an
        open map of the world built by hundreds of thousands of people who
        surveyed their own streets. A city full of real places on day one is
        their work, not ours.
      </p>

      <Section title="Attribution">
        <p>
          Place data and map imagery are{" "}
          <A href={OSM_COPYRIGHT}>© OpenStreetMap contributors</A>, used under
          the <A href={ODBL}>Open Database License (ODbL) v1.0</A>. Map tiles are
          by <A href="https://carto.com/attributions">CARTO</A>.
        </p>
        <p>
          This credit also appears on the map and on every place page that shows
          imported data.
        </p>
      </Section>

      <Section title="Corrections belong upstream">
        <p>
          If a place is wrong — a closed business, a misplaced pin, a misspelled
          name — the durable fix is to correct it in{" "}
          <A href="https://www.openstreetmap.org/">OpenStreetMap</A> itself,
          where the correction reaches everyone using the same data rather than
          only us. We keep imported records as they were imported.
        </p>
        <p>
          Reports of permanently closed places are still welcome in the app, and
          we act on them here.
        </p>
      </Section>

      <Section title="Getting the data">
        {/* PRE-LAUNCH: support@ventzon.com must be receiving mail before this
            page is public. This is the SECOND surface pointing at it — the
            under-13 parental-contact copy is the other — so an unmonitored
            inbox now breaks a COPPA route and an ODbL obligation at once. */}
        <p>
          Where our place records are derived from OpenStreetMap, that derived
          data is offered under the same <A href={ODBL}>ODbL v1.0</A>. To request
          a machine-readable copy, email{" "}
          <A href="mailto:support@ventzon.com">support@ventzon.com</A>.
        </p>
        <p>
          This applies to imported place records only. It does not cover posts,
          photos, comments, check-ins, accounts, or information a business
          supplies about itself — none of which come from OpenStreetMap, and all
          of which are kept separate from it.
        </p>
      </Section>
    </main>
  );
}
