// src/app/how-it-works/page.tsx
import Image from "next/image";

export const metadata = {
  title: "How it works | Ventzon",
  description: "How Ventzon Rewards works for shops and customers.",
};

const customerSteps = [
  {
    title: "Scan the shop QR",
    body: "Use your phone camera to scan the QR code at checkout.",
  },
  {
    title: "Enter phone + 6-digit PIN",
    body: "Your phone ties visits to that shop. Your 6-digit PIN lets you check in later (no account login).",
  },
  {
    title: "Check in once per day",
    body: "To keep it fair, each customer can only check in 1× per day per shop.",
  },
  {
    title: "Hit the goal → redeem",
    body: "When you reach the shop’s visit goal, you’ll get a redeem message. Show it to the cashier.",
  },
  {
    title: "Progress resets after redeem",
    body: "After redeeming, your visit counter resets so you can start earning again.",
  },
];

const shopSteps = [
  {
    title: "Set your reward",
    body: "Choose the reward title/details and pick the visits goal (2–31).",
  },
  {
    title: "Print + place the QR",
    body: "Put the QR near checkout so people can scan while paying.",
  },
  {
    title: "Customize texts",
    body: "Edit the messages customers get for progress + redeem.",
  },
  {
    title: "Send promos (optional)",
    body: "Message your opted-in list when you want to drive traffic.",
  },
];

function GlassCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.55)] backdrop-blur">
      <div className="flex items-start justify-between gap-6">
        <div>
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          {subtitle ? (
            <p className="mt-1 text-sm text-white/65">{subtitle}</p>
          ) : null}
        </div>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function StepList({ items }: { items: { title: string; body: string }[] }) {
  return (
    <ol className="space-y-4">
      {items.map((s, idx) => (
        <li key={s.title} className="flex gap-3">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/5 text-xs text-white/80">
            {idx + 1}
          </div>
          <div>
            <div className="font-medium text-white">{s.title}</div>
            <div className="mt-1 text-sm text-white/70">{s.body}</div>
          </div>
        </li>
      ))}
    </ol>
  );
}

function Stat({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
      <div className="text-xs uppercase tracking-[0.22em] text-white/55">
        {label}
      </div>
      <div className="mt-2 text-2xl font-semibold text-white">{value}</div>
      <div className="mt-2 text-sm text-white/65">{note}</div>
    </div>
  );
}

export default function HowItWorksPage() {
  return (
    <main className="min-h-[calc(100vh-72px)] px-6 py-16 text-white">
      <div className="mx-auto w-full max-w-6xl">
        {/* Hero */}
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <div className="text-xs uppercase tracking-[0.28em] text-white/60">
              Ventzon Rewards
            </div>
            <h1 className="mt-3 text-4xl font-semibold leading-tight">
              A loyalty program customers actually use.
            </h1>
            <p className="mt-4 max-w-xl text-white/70">
              Scan a QR, enter phone + a 6-digit PIN, check in once per day, and
              redeem when you hit the shop’s goal. Simple for customers, valuable
              for merchants.
            </p>

            {/* CTA row */}
            <div className="mt-7 flex flex-wrap gap-3">
              <a
                href="/merchant"
                className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black hover:bg-white/90"
              >
                Merchant dashboard
              </a>
              <a
                href="/pricing"
                className="rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/10"
              >
                View pricing
              </a>
            </div>

            {/* Quick benefits */}
            <div className="mt-10 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="text-sm font-semibold">No apps to download</div>
                <div className="mt-1 text-sm text-white/65">
                  Customers use their camera + SMS. Done.
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="text-sm font-semibold">Designed for checkout</div>
                <div className="mt-1 text-sm text-white/65">
                  One scan, one check-in/day, redemption text.
                </div>
              </div>
            </div>
          </div>

          {/* Image placeholders */}
          <div className="grid gap-6">
            <GlassCard
              title="Add screenshots here"
              subtitle="Drop images into /public/howitworks/* and swap the src paths."
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/10 to-transparent">
                  <Image
                    src="/howitworks/customer.png"
                    alt="Customer flow screenshot"
                    fill
                    className="object-cover opacity-90"
                  />
                </div>
                <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/10 to-transparent">
                  <Image
                    src="/howitworks/merchant.png"
                    alt="Merchant dashboard screenshot"
                    fill
                    className="object-cover opacity-90"
                  />
                </div>
              </div>
              <p className="mt-4 text-sm text-white/65">
                If you don’t have screenshots yet, keep these files empty for
                now — the cards still look good.
              </p>
            </GlassCard>
          </div>
        </div>

        {/* Tabs-ish layout */}
        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          <GlassCard
            title="For customers"
            subtitle="Fast check-ins + a clear redeem text to show at the register."
          >
            <StepList items={customerSteps} />
          </GlassCard>

          <GlassCard
            title="For merchants"
            subtitle="Set the goal, customize the texts, and optionally run promos."
          >
            <StepList items={shopSteps} />
          </GlassCard>
        </div>

        {/* Why it helps */}
        <div className="mt-10">
          <GlassCard
            title="Why this helps shop owners"
            subtitle="Loyalty isn’t just discounts — it’s behavior shaping."
          >
            <div className="grid gap-4 md:grid-cols-3">
              <Stat
                label="Repeat visits"
                value="↑"
                note="A visible goal nudges customers to come back sooner to “finish the punch card.”"
              />
              <Stat
                label="Basket size"
                value="↑"
                note="Customers who feel “close to earning” often add an item or choose your shop over another."
              />
              <Stat
                label="Direct channel"
                value="SMS"
                note="Promos go straight to the customer (not an algorithm). Opt-in only."
              />
            </div>

            <div className="mt-6 rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white/70">
              Tip: keep the reward simple (free item / % off) and set a goal that
              matches your purchase cycle (coffee shops 5–10, salons 2–5, etc.).
            </div>
          </GlassCard>
        </div>

        {/* Good to know */}
        <div className="mt-10 rounded-3xl border border-white/10 bg-white/[0.04] p-6 text-sm text-white/80 backdrop-blur">
          <div className="font-medium text-white">Good to know</div>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-white/70">
            <li>
              A customer is linked to a shop by phone number (same phone can join
              multiple shops).
            </li>
            <li>
              The 6-digit PIN is for quick re-check-ins — no account creation
              needed.
            </li>
            <li>
              One check-in/day per shop prevents spam and keeps it fair.
            </li>
          </ul>
        </div>
      </div>
    </main>
  );
}