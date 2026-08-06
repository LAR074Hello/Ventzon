import Link from "next/link";
import { ArrowRight } from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";

/* What a shop actually gets — every line is a real, shipped feature. */
const INCLUDED = [
  "QR code + join page for your counter",
  "Unlimited customer check-ins",
  "A customer list of names and emails you own",
  "Rewards you set — goal and reward, in minutes",
  "Automated emails and push when a reward is near",
  "Analytics: who's returning, who's drifting",
];

/**
 * The pricing section at the end of the shop-owner act. Two flat plans,
 * no invented statistics — the case is the real feature list and the
 * design, not claims.
 */
export default function PricingSection() {
  return (
    <section className="px-6 py-32 sm:py-44">
      <div className="mx-auto max-w-5xl">
        <ScrollReveal className="mx-auto max-w-3xl text-center">
          <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-fog-500">
            For shop owners
          </p>
          <h2 className="mt-6 font-display text-[clamp(1.75rem,3.5vw,3rem)] font-normal leading-[1.12] tracking-[0.01em]">
            One flat price.
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-[17px] font-light leading-[1.75] text-fog-300">
            Everything a loyalty program needs, for one simple fee. No hardware,
            no per-redemption charges, no contracts.
          </p>
        </ScrollReveal>

        <div className="mt-16 grid gap-6 md:grid-cols-2">
          {/* Monthly */}
          <ScrollReveal>
            <div className="flex h-full flex-col rounded-[2rem] bg-night-800 p-12 shadow-warm transition-all duration-700 ease-luxe hover:-translate-y-1 hover:shadow-warm-lg hover:ring-1 hover:ring-white/10">
              <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-fog-500">Monthly</p>
              <p className="mt-7 font-display text-[2.5rem] font-normal leading-none tracking-[0.02em] text-fog-100">
                $25<span className="text-[1rem] text-fog-300">/month</span>
              </p>
              <p className="mt-3 text-[14px] font-light text-fog-300">Flat. Month to month, cancel anytime.</p>
              <ul className="mt-8 space-y-3">
                {INCLUDED.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-3 text-[15px] font-light leading-[1.6] text-fog-200"
                  >
                    <span className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-maroon-400" />
                    {item}
                  </li>
                ))}
              </ul>
              <div className="mt-10 pt-2">
                <Link
                  href="/signup"
                  className="group btn-pill inline-flex items-center gap-2.5 rounded-full border border-fog-100/20 px-8 py-3.5 text-[13px] font-medium tracking-[0.15em] text-fog-100 hover:border-fog-100/50"
                >
                  Start with monthly
                  <ArrowRight className="h-3.5 w-3.5 transition-transform duration-500 ease-luxe group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
          </ScrollReveal>

          {/* Yearly */}
          <ScrollReveal delay={1}>
            <div className="flex h-full flex-col rounded-[2rem] bg-maroon-900 p-12 ring-1 ring-maroon-800 shadow-warm transition-all duration-700 ease-luxe hover:-translate-y-1 hover:shadow-warm-lg">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-maroon-300">Yearly</p>
                <span className="rounded-full bg-maroon-950/60 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.15em] text-maroon-300">
                  Two months free
                </span>
              </div>
              <p className="mt-7 font-display text-[2.5rem] font-normal leading-none tracking-[0.02em] text-white">
                $250<span className="text-[1rem] text-fog-300">/year</span>
              </p>
              <p className="mt-3 text-[14px] font-light text-fog-300">Save $50 vs monthly — ten months paid, two free.</p>
              <ul className="mt-8 space-y-3">
                {INCLUDED.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-3 text-[15px] font-light leading-[1.6] text-fog-100"
                  >
                    <span className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-maroon-300" />
                    {item}
                  </li>
                ))}
              </ul>
              <div className="mt-10 pt-2">
                <Link
                  href="/signup"
                  className="group btn-pill inline-flex items-center gap-2.5 rounded-full bg-white px-8 py-3.5 text-[13px] font-medium tracking-[0.15em] text-black hover:bg-cream"
                >
                  Start with yearly
                  <ArrowRight className="h-3.5 w-3.5 transition-transform duration-500 ease-luxe group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
          </ScrollReveal>
        </div>

        {/* Setup + honest reassurance */}
        <ScrollReveal className="mx-auto mt-16 max-w-2xl text-center">
          <p className="text-[17px] font-light leading-[1.8] text-fog-300">
            Setup takes minutes: create your shop, print the QR code, put it on
            the counter. Customers check themselves in — you watch them come back.
          </p>
          <p className="mt-6 text-[13px] font-light tracking-[0.08em] text-fog-500">
            No per-redemption fees · No contracts · Cancel anytime
          </p>
          <Link
            href="/pricing"
            className="group mt-8 inline-flex items-center gap-2 text-[13px] font-medium tracking-[0.12em] text-maroon-300 transition-colors duration-300 ease-luxe hover:text-maroon-200"
          >
            See full pricing
            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-500 ease-luxe group-hover:translate-x-1" />
          </Link>
        </ScrollReveal>
      </div>
    </section>
  );
}
