import Link from "next/link";
import { ArrowRight, MapPin, Clock, DollarSign, TrendingUp } from "lucide-react";
import SiteFooter from "@/components/SiteFooter";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Careers — Ventzon",
  description: "Join the team building the future of local loyalty rewards. View open positions at Ventzon.",
};

const perks = [
  { icon: TrendingUp, label: "Equity upside", detail: "Get in early at a growing startup" },
  { icon: DollarSign, label: "Commission-based", detail: "Uncapped earning potential" },
  { icon: Clock, label: "Flexible hours", detail: "Work around your schedule" },
  { icon: MapPin, label: "Local impact", detail: "Help small businesses in your city thrive" },
];

export default function CareersPage() {
  return (
    <main className="min-h-screen bg-black text-[#ededed]">
      {/* Hero */}
      <section className="px-8 pb-20 pt-40">
        <div className="mx-auto max-w-3xl">
          <p className="text-[11px] font-light tracking-[0.4em] text-[#888]">CAREERS</p>
          <h1 className="mt-5 text-4xl font-extralight tracking-[-0.02em] text-[#ededed] sm:text-5xl">
            Build something<br />that matters.
          </h1>
          <p className="mt-6 max-w-xl text-[15px] font-light leading-relaxed text-[#aaa]">
            Ventzon is rewiring how local businesses build customer loyalty. We're a small team moving fast — every person here has a real impact.
          </p>
        </div>
      </section>

      {/* Divider */}
      <div className="mx-8 border-t border-[#222]" />

      {/* Open positions */}
      <section className="px-8 py-20">
        <div className="mx-auto max-w-3xl">
          <p className="text-[11px] font-light tracking-[0.4em] text-[#888]">OPEN POSITIONS</p>
          <h2 className="mt-4 text-[22px] font-extralight text-[#ededed]">1 opening right now</h2>

          {/* Job card */}
          <div className="mt-10 rounded-2xl border border-[#2a2a2a] bg-[#0a0a0a] p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="rounded-full border border-emerald-800/50 bg-emerald-950/30 px-2.5 py-1 text-[10px] font-light tracking-[0.15em] text-emerald-400">
                    HIRING
                  </span>
                  <span className="text-[10px] font-light tracking-[0.15em] text-[#777]">1099 CONTRACTOR</span>
                </div>
                <h3 className="mt-3 text-[24px] font-extralight text-[#ededed]">Business Development Representative</h3>
                <div className="mt-2 flex flex-wrap items-center gap-4">
                  <span className="flex items-center gap-1.5 text-[12px] font-light text-[#999]">
                    <MapPin className="h-3 w-3" /> Your city (field-based)
                  </span>
                  <span className="flex items-center gap-1.5 text-[12px] font-light text-[#999]">
                    <Clock className="h-3 w-3" /> Flexible · Work when you want
                  </span>
                  <span className="flex items-center gap-1.5 text-[12px] font-light text-[#999]">
                    <DollarSign className="h-3 w-3" /> 20% monthly recurring commission
                  </span>
                </div>
              </div>

              <Link
                href="/careers/business-development-representative"
                className="inline-flex shrink-0 items-center gap-2.5 rounded-full border border-[#ededed] px-6 py-3 text-[12px] font-light tracking-[0.15em] text-[#ededed] transition-all duration-300 hover:bg-[#ededed] hover:text-black"
              >
                View & apply <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="mt-8 space-y-8 border-t border-[#222] pt-8">
              <div>
                <p className="text-[11px] font-light tracking-[0.3em] text-[#888]">ABOUT THE ROLE</p>
                <p className="mt-4 text-[14px] font-light leading-relaxed text-[#bbb]">
                  As a Business Development Representative at Ventzon, you'll be the face of the company — walking into local businesses, building relationships with owners, and signing them up for the platform. This is a flexible, commission-based side hustle where you identify target businesses in your area, introduce them to Ventzon, and walk owners through a live demo on the spot.
                </p>
                <p className="mt-3 text-[14px] font-light leading-relaxed text-[#bbb]">
                  Beyond the initial sale, you'll serve as the primary point of contact for your merchants — following up, answering questions, and making sure they're getting real value out of the platform.
                </p>
              </div>

              <div>
                <p className="text-[11px] font-light tracking-[0.3em] text-[#888]">WHAT WE'RE LOOKING FOR</p>
                <ul className="mt-4 space-y-2.5">
                  {[
                    "Strong interpersonal skills — comfortable walking into a business cold",
                    "Self-motivated and able to manage your own time and territory",
                    "Reliable transportation and willingness to travel locally",
                    "A smartphone capable of running the Ventzon app for live demos",
                    "Prior customer-facing experience is a plus but not required",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3 text-[14px] font-light text-[#bbb]">
                      <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[#666]" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="text-[11px] font-light tracking-[0.3em] text-[#888]">COMPENSATION</p>
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {[
                    { label: "20%", detail: "Of monthly subscription revenue per merchant" },
                    { label: "Recurring", detail: "Earn as long as your merchants stay active" },
                    { label: "Uncapped", detail: "Your book of business grows over time" },
                  ].map(({ label, detail }) => (
                    <div key={label} className="rounded-xl border border-[#222] p-4">
                      <p className="text-[18px] font-extralight text-[#ededed]">{label}</p>
                      <p className="mt-1 text-[12px] font-light text-[#999]">{detail}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-[#2a2a2a] bg-[#060606] p-6 text-center">
                <p className="text-[15px] font-extralight text-[#ededed]">Ready to apply?</p>
                <p className="mt-2 text-[13px] font-light text-[#999]">
                  Takes about 5 minutes. No resume required to get started.
                </p>
                <Link
                  href="/careers/business-development-representative/apply"
                  className="mt-5 inline-flex items-center gap-2.5 rounded-full border border-[#ededed] px-8 py-3.5 text-[12px] font-light tracking-[0.15em] text-[#ededed] transition-all duration-300 hover:bg-[#ededed] hover:text-black"
                >
                  Apply now <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Ventzon */}
      <section className="px-8 pb-24">
        <div className="mx-auto max-w-3xl">
          <div className="border-t border-[#222] pt-16">
            <p className="text-[11px] font-light tracking-[0.4em] text-[#888]">WHY VENTZON</p>
            <h2 className="mt-4 text-[22px] font-extralight text-[#ededed]">More than a side hustle</h2>
            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {perks.map(({ icon: Icon, label, detail }) => (
                <div key={label} className="flex items-start gap-4 rounded-xl border border-[#222] p-5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#333]">
                    <Icon className="h-3.5 w-3.5 text-[#888]" />
                  </div>
                  <div>
                    <p className="text-[14px] font-light text-[#ededed]">{label}</p>
                    <p className="mt-0.5 text-[12px] font-light text-[#999]">{detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
