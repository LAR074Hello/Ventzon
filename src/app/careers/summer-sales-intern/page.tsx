import Link from "next/link";
import { ArrowRight, MapPin, Clock, DollarSign } from "lucide-react";
import SiteFooter from "@/components/SiteFooter";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Summer Sales Intern — Ventzon Careers",
  description: "Join Ventzon as a Summer Sales Intern. Help local businesses build loyalty and earn uncapped commission.",
};

export default function SummerSalesInternPage() {
  return (
    <main className="min-h-screen bg-black text-[#ededed]">

      {/* Hero */}
      <section className="px-8 pb-12 pt-40">
        <div className="mx-auto max-w-3xl">
          <Link
            href="/careers"
            className="text-[11px] font-light tracking-[0.3em] text-[#777] transition-colors hover:text-[#aaa]"
          >
            ← CAREERS
          </Link>

          <div className="mt-6 flex items-center gap-2.5">
            <span className="rounded-full border border-emerald-800/50 bg-emerald-950/30 px-2.5 py-1 text-[10px] font-light tracking-[0.15em] text-emerald-400">
              HIRING NOW
            </span>
            <span className="text-[10px] font-light tracking-[0.15em] text-[#777]">INTERNSHIP</span>
          </div>

          <h1 className="mt-4 text-4xl font-extralight tracking-[-0.02em] text-[#ededed] sm:text-5xl">
            Summer Sales Intern
          </h1>

          <div className="mt-5 flex flex-wrap items-center gap-5">
            <span className="flex items-center gap-1.5 text-[13px] font-light text-[#aaa]">
              <MapPin className="h-3.5 w-3.5" /> Your city (field-based)
            </span>
            <span className="flex items-center gap-1.5 text-[13px] font-light text-[#aaa]">
              <Clock className="h-3.5 w-3.5" /> Summer 2025
            </span>
            <span className="flex items-center gap-1.5 text-[13px] font-light text-[#aaa]">
              <DollarSign className="h-3.5 w-3.5" /> $50–100/merchant + bonuses
            </span>
          </div>

          <Link
            href="/careers/summer-sales-intern/apply"
            className="mt-8 inline-flex items-center gap-2.5 rounded-full border border-[#ededed] px-8 py-3.5 text-[12px] font-light tracking-[0.15em] text-[#ededed] transition-all duration-300 hover:bg-[#ededed] hover:text-black"
          >
            Apply now <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </section>

      <div className="mx-8 border-t border-[#222]" />

      {/* Body */}
      <section className="px-8 py-16">
        <div className="mx-auto max-w-3xl space-y-14">

          <div>
            <p className="text-[11px] font-light tracking-[0.3em] text-[#888]">ABOUT THE ROLE</p>
            <p className="mt-5 text-[15px] font-light leading-relaxed text-[#bbb]">
              Ventzon is building the loyalty layer for local businesses — the tech that turns one-time customers into regulars. We're growing fast and need boots on the ground to bring merchants onto the platform.
            </p>
            <p className="mt-4 text-[15px] font-light leading-relaxed text-[#bbb]">
              As a Summer Sales Intern, you'll own merchant acquisition in your city. You'll walk into coffee shops, restaurants, salons, and retail stores, pitch the product, and sign them up on the spot. No cold calling — this is real, in-person relationship selling.
            </p>
            <p className="mt-4 text-[15px] font-light leading-relaxed text-[#bbb]">
              This is a ground-floor opportunity. You'll have a direct line to the founders, your feedback shapes the product, and top performers have a path to a full-time role.
            </p>
          </div>

          <div>
            <p className="text-[11px] font-light tracking-[0.3em] text-[#888]">WHAT YOU'LL DO</p>
            <ul className="mt-5 space-y-3">
              {[
                "Walk into local businesses and pitch Ventzon's loyalty program face-to-face",
                "Sign up new merchants and get their profile live on the platform during your visit",
                "Build genuine relationships with shop owners and follow up on their progress",
                "Report weekly on outreach volume, conversion rates, and merchant feedback",
                "Identify objections and work with the team to refine the pitch",
                "Help grow Ventzon's presence in your market from the ground up",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-[14px] font-light leading-relaxed text-[#bbb]">
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[#666]" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-[11px] font-light tracking-[0.3em] text-[#888]">WHO YOU ARE</p>
            <ul className="mt-5 space-y-3">
              {[
                "Outgoing and confident — you enjoy talking to people you've never met",
                "Persuasive communicator who can explain a product clearly and simply",
                "Self-starter who takes initiative without needing constant direction",
                "Based locally — you'll be visiting businesses in person daily",
                "Hungry to grow and motivated by results, not just showing up",
                "Sales, retail, or customer-facing experience is a plus but not required",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-[14px] font-light leading-relaxed text-[#bbb]">
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[#666]" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-[11px] font-light tracking-[0.3em] text-[#888]">COMPENSATION</p>
            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {[
                { label: "$50–100", detail: "Per merchant signed up and active" },
                { label: "Uncapped", detail: "No ceiling on your earnings" },
                { label: "Bonus", detail: "Paid for top performers each month" },
              ].map(({ label, detail }) => (
                <div key={label} className="rounded-xl border border-[#222] bg-[#0a0a0a] p-5">
                  <p className="text-[20px] font-extralight text-[#ededed]">{label}</p>
                  <p className="mt-1 text-[12px] font-light text-[#999]">{detail}</p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="rounded-2xl border border-[#2a2a2a] bg-[#060606] p-8 text-center">
            <p className="text-[18px] font-extralight text-[#ededed]">Sound like you?</p>
            <p className="mt-2 text-[13px] font-light text-[#999]">
              Applications take about 5 minutes. No cover letter required to get started.
            </p>
            <Link
              href="/careers/summer-sales-intern/apply"
              className="mt-6 inline-flex items-center gap-2.5 rounded-full border border-[#ededed] px-8 py-3.5 text-[12px] font-light tracking-[0.15em] text-[#ededed] transition-all duration-300 hover:bg-[#ededed] hover:text-black"
            >
              Start application <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
