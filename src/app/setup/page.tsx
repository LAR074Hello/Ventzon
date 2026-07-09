"use client";

import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";
import SiteFooter from "@/components/SiteFooter";

const steps = [
  {
    number: "01",
    title: "Create your account",
    body: "Go to ventzon.com and choose Get started. Enter your email and pick a password — that's how you'll sign in from now on.",
  },
  {
    number: "02",
    title: "Name your shop",
    body: "Type your business name, for example “Sunrise Bakery.” This is the name customers see when they check in, so use the one on your sign.",
  },
  {
    number: "03",
    title: "Choose a plan and subscribe",
    body: "Pick monthly ($25/month) or yearly ($240/year — two months free) and enter your card. On top of the flat fee, you pay just $0.85 each time a customer actually earns a reward. You pay more only when it's working.",
  },
  {
    number: "04",
    title: "Set up your reward",
    body: "In your dashboard, decide what customers earn and how: your offer (“Free coffee,” “10% off”), whether they earn it by visits or points, and your logo and store address. Coffee shops usually set 8–10 visits per reward; salons, 3–5.",
  },
  {
    number: "05",
    title: "Print your QR code",
    body: "In the dashboard, open Print card (or Download QR). A normal sheet of paper works, or bring the file to a print shop for something sturdier to stand on the counter.",
  },
  {
    number: "06",
    title: "Place it at your register",
    body: "Set the QR where customers pay. To join, they scan it with their phone camera and enter their phone or email — nothing to download to get started. Every visit after that, they scan again and earn their stamp. You're live.",
  },
];

export default function SetupPage() {
  return (
    <main className="min-h-screen bg-black text-[#ededed]">
      {/* ── Hero ── */}
      <section className="px-4 sm:px-8 pt-36 pb-16 sm:pt-44">
        <div className="mx-auto max-w-3xl text-center">
          <ScrollReveal>
            <p className="text-[11px] font-light tracking-[0.5em] text-[#666]">
              MERCHANT GUIDE
            </p>
            <h1 className="mt-6 text-3xl font-extralight tracking-[-0.02em] sm:text-4xl lg:text-5xl">
              Get your loyalty program running
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-[15px] font-light leading-[1.8] text-[#666]">
              From creating your account to a printed QR code sitting on your counter &mdash; about five minutes, no hardware, and no tech skills required.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-[12px] font-light text-[#555]">
              <span className="inline-flex items-center gap-2"><span className="h-1 w-1 rounded-full bg-emerald-500" /> About 5 minutes</span>
              <span className="inline-flex items-center gap-2"><span className="h-1 w-1 rounded-full bg-emerald-500" /> Phone or computer</span>
              <span className="inline-flex items-center gap-2"><span className="h-1 w-1 rounded-full bg-emerald-500" /> You'll print one QR code</span>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ── Before you begin ── */}
      <section className="px-4 sm:px-8 pb-4">
        <div className="mx-auto max-w-2xl">
          <ScrollReveal>
            <div className="rounded-2xl border border-[#1a1a1a] bg-[#050505] p-6 sm:p-7">
              <p className="text-[11px] font-light tracking-[0.3em] text-[#555]">BEFORE YOU BEGIN</p>
              <p className="mt-3 text-[14px] font-light leading-relaxed text-[#888]">
                Have three things handy: an <span className="text-[#ededed]">email address</span> (this becomes your login), a <span className="text-[#ededed]">card</span> for your subscription, and a way to <span className="text-[#ededed]">print one page</span> &mdash; your home printer is fine, or any print shop.
              </p>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ── Steps ── */}
      <section className="px-4 sm:px-8 py-16 sm:py-20">
        <div className="mx-auto max-w-3xl">
          <div className="luxury-divider mx-auto mb-16 max-w-xs" />
          <div className="space-y-14">
            {steps.map((step, i) => (
              <ScrollReveal key={step.number} delay={i % 2 === 0 ? 1 : 2}>
                <div className="grid grid-cols-[auto_1fr] gap-6 sm:gap-8">
                  <p className="font-mono text-[13px] font-light tracking-[0.2em] text-[#444]">
                    {step.number}
                  </p>
                  <div>
                    <h2 className="text-xl font-extralight tracking-[-0.01em] text-white sm:text-2xl">
                      {step.title}
                    </h2>
                    <p className="mt-4 text-[15px] font-light leading-[1.8] text-[#888]">
                      {step.body}
                    </p>
                    {step.number === "06" && (
                      <p className="mt-4 border-l border-emerald-900/40 pl-4 text-[13px] font-light leading-relaxed text-[#666]">
                        <span className="text-[#999]">Optional:</span> customers who want reminders can download the free Ventzon app to get nudged when they're close to a reward and see all their cards in one place. It's never required to join or earn &mdash; the QR works on its own.
                      </p>
                    )}
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── What customers experience ── */}
      <section className="px-4 sm:px-8 py-16 sm:py-20">
        <div className="mx-auto max-w-3xl">
          <div className="luxury-divider mx-auto mb-16 max-w-xs" />
          <ScrollReveal>
            <div className="rounded-2xl border border-emerald-900/25 bg-emerald-950/10 p-7 sm:p-9">
              <p className="text-[11px] font-light tracking-[0.3em] text-emerald-400/70">
                WHAT YOUR CUSTOMERS EXPERIENCE
              </p>
              <h2 className="mt-4 text-2xl font-extralight tracking-[-0.01em] text-white">
                Three taps, no download
              </h2>
              <div className="mt-6 flex flex-wrap items-center gap-3 text-[13px] font-light">
                {["Scan the code", "Enter phone or email", "They're in"].map((t, i) => (
                  <span key={t} className="inline-flex items-center gap-3">
                    <span className="rounded-full border border-[#1a1a1a] bg-[#0a0a0a] px-4 py-2 text-[#ededed]">{t}</span>
                    {i < 2 && <span className="text-emerald-500">&rarr;</span>}
                  </span>
                ))}
              </div>
              <p className="mt-6 text-[14px] font-light leading-relaxed text-[#888]">
                Each visit adds a stamp (or points). When they reach your goal, the screen shows their reward to display at the register. Simple enough that nobody needs help using it.
              </p>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ── Running it / help ── */}
      <section className="px-4 sm:px-8 pb-4">
        <div className="mx-auto max-w-3xl grid gap-6 sm:grid-cols-2">
          <ScrollReveal delay={1}>
            <div className="h-full rounded-2xl border border-[#1a1a1a] p-6 transition-all duration-500 hover:border-[#333]">
              <p className="text-[11px] font-light tracking-[0.3em] text-[#555]">RUNNING IT DAY TO DAY</p>
              <p className="mt-3 text-[14px] font-light leading-relaxed text-[#888]">
                Your dashboard shows check-ins, your best customers, busiest days, and who's drifting away. You can email your regulars, add a stamp by hand at the counter, and manage billing any time.
              </p>
            </div>
          </ScrollReveal>
          <ScrollReveal delay={2}>
            <div className="h-full rounded-2xl border border-[#1a1a1a] p-6 transition-all duration-500 hover:border-[#333]">
              <p className="text-[11px] font-light tracking-[0.3em] text-[#555]">NEED A HAND?</p>
              <p className="mt-3 text-[14px] font-light leading-relaxed text-[#888]">
                We're happy to help you get set up. Email{" "}
                <a href="mailto:support@ventzon.com" className="text-emerald-400/80 transition-colors hover:text-emerald-300">support@ventzon.com</a>{" "}
                and we'll walk you through anything.
              </p>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="px-4 sm:px-8 py-20 sm:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <ScrollReveal>
            <h2 className="text-2xl font-extralight tracking-[-0.02em] sm:text-3xl">
              Ready to set yours up?
            </h2>
            <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link
                href="/signup"
                className="inline-flex items-center gap-3 rounded-full border border-white/40 px-8 py-3.5 text-[12px] font-light tracking-[0.15em] text-white transition-all duration-500 hover:border-white hover:bg-white hover:text-black"
              >
                Get started
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                href="/pricing"
                className="text-[12px] font-light tracking-[0.15em] text-[#555] transition-colors duration-500 hover:text-[#ededed]"
              >
                See pricing
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
