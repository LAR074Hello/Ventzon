"use client";

import { analyticsMock, previewOverview } from "@/lib/merchant-preview-data";

/* The analytics answers as an owner sees them: four question cards plus the
   audience line. Sample data, labeled EXAMPLE. Used on the homepage and the
   For shops page. */
export default function AnalyticsPreview() {
  const m = analyticsMock;
  const cards = [
    {
      q: "Your regulars",
      v: String(m.loyal_count),
      line: `They spend $${m.spend.loyal_avg_ticket.toFixed(2)} a visit vs. $${m.spend.other_avg_ticket.toFixed(2)} for everyone else.`,
      action: "See customers",
    },
    {
      q: "Slipping away",
      v: String(m.at_risk_count + m.lapsed_count),
      line: "Customers who haven't been back in 2 to 8 weeks.",
      action: "Send a come-back email",
    },
    {
      q: "Your busy times",
      v: "Saturday",
      line: "Busiest in the morning rush. Monday is your slowest.",
      action: "Promote your slow day",
    },
    {
      q: "Did your promo work?",
      v: String(m.last_promo.came_back),
      line: `${m.last_promo.came_back} of ${m.last_promo.reached} customers came back within a week.`,
      action: "Send another",
    },
  ];
  return (
    <div className="merchant-dark overflow-hidden rounded-xl border border-subtle bg-surface text-left text-primary">
      <div className="flex items-center justify-between gap-4 border-b border-subtle px-5 py-3.5 sm:px-6">
        <div className="min-w-0">
          <p className="truncate font-display text-base font-medium text-primary">{previewOverview.shopName}</p>
          <p className="mt-0.5 truncate text-xs text-muted">Analytics · last 30 days</p>
        </div>
        <span className="shrink-0 rounded-md border border-subtle px-2 py-0.5 text-2xs font-medium uppercase tracking-caps text-muted">
          EXAMPLE
        </span>
      </div>
      <div className="grid gap-px bg-subtle sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.q} className="flex flex-col bg-surface-raised p-5">
            <p className="text-2xs font-medium uppercase tracking-caps text-muted">{c.q}</p>
            <p className="mt-2 text-3xl font-semibold leading-none tracking-tight tabular-nums">{c.v}</p>
            <p className="mt-2 flex-1 text-xs leading-relaxed text-muted">{c.line}</p>
            <span className="mt-4 inline-flex self-start rounded-full border border-strong px-3 py-1.5 text-2xs font-medium tracking-caps text-secondary">
              {c.action}
            </span>
          </div>
        ))}
      </div>
      <div className="border-t border-subtle bg-surface-raised px-5 py-4 sm:px-6">
        <p className="text-2xs font-medium uppercase tracking-caps text-muted">Your audience</p>
        <p className="mt-1.5 text-sm leading-relaxed text-secondary">
          Mostly 25-34, into coffee, fitness and brunch. Compared with others nearby, your
          customers are 2.1x more likely to be into fitness.
        </p>
      </div>
    </div>
  );
}
