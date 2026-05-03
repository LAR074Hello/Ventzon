import Link from "next/link";
import { ArrowRight, MapPin, Clock, DollarSign } from "lucide-react";
import SiteFooter from "@/components/SiteFooter";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Business Development Representative — Ventzon Careers",
  description: "Join Ventzon as a Business Development Representative. Help local businesses build loyalty and earn 20% recurring commission.",
};

export default function BDRPage() {
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
            <span className="text-[10px] font-light tracking-[0.15em] text-[#777]">1099 CONTRACTOR</span>
          </div>

          <h1 className="mt-4 text-4xl font-extralight tracking-[-0.02em] text-[#ededed] sm:text-5xl">
            Business Development<br />Representative
          </h1>

          <div className="mt-5 flex flex-wrap items-center gap-5">
            <span className="flex items-center gap-1.5 text-[13px] font-light text-[#aaa]">
              <MapPin className="h-3.5 w-3.5" /> Your city (field-based)
            </span>
            <span className="flex items-center gap-1.5 text-[13px] font-light text-[#aaa]">
              <Clock className="h-3.5 w-3.5" /> Flexible · Work when you want
            </span>
            <span className="flex items-center gap-1.5 text-[13px] font-light text-[#aaa]">
              <DollarSign className="h-3.5 w-3.5" /> 20% monthly recurring commission
            </span>
          </div>

          <Link
            href="/careers/business-development-representative/apply"
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
            <p className="text-[11px] font-light tracking-[0.3em] text-[#888]">ABOUT THE COMPANY</p>
            <p className="mt-5 text-[15px] font-light leading-relaxed text-[#bbb]">
              Ventzon is a loyalty rewards platform built for independent local businesses. We give coffee shops, barbershops, gyms, restaurants, and other local businesses a simple digital loyalty program — no hardware, no setup fees, and no technical knowledge required.
            </p>
            <p className="mt-4 text-[15px] font-light leading-relaxed text-[#bbb]">
              Customers check in by scanning a QR code, collect stamps, and earn rewards. We're an early-stage startup growing fast and looking for driven people to help us build something that genuinely helps local communities.
            </p>
          </div>

          <div>
            <p className="text-[11px] font-light tracking-[0.3em] text-[#888]">ABOUT THE ROLE</p>
            <p className="mt-5 text-[15px] font-light leading-relaxed text-[#bbb]">
              As a Business Development Representative at Ventzon, you'll be the face of the company — walking into local businesses, building relationships with owners, and signing them up for the platform. This is a flexible, commission-based side hustle where you'll identify target businesses in your area, introduce them to Ventzon, and walk owners through a live demo on the spot.
            </p>
            <p className="mt-4 text-[15px] font-light leading-relaxed text-[#bbb]">
              Once a merchant is interested, you'll guide them through the full onboarding process — setting up their account, configuring their reward program, and making sure their QR code is live and working in their store before you leave.
            </p>
            <p className="mt-4 text-[15px] font-light leading-relaxed text-[#bbb]">
              Beyond the initial sale, you'll serve as the primary point of contact for your merchants as the company grows. That means following up regularly, answering questions, troubleshooting any issues, and making sure they're getting real value out of the platform.
            </p>
          </div>

          <div>
            <p className="text-[11px] font-light tracking-[0.3em] text-[#888]">WHAT YOU'LL DO</p>
            <ul className="mt-5 space-y-3">
              {[
                "Identify target businesses in your area and introduce them to Ventzon face-to-face",
                "Walk owners through a live demo on the spot and sign them up during the visit",
                "Guide new merchants through full onboarding — account setup, reward config, QR live in-store",
                "Serve as primary point of contact: follow up, troubleshoot, ensure merchants see real value",
                "Manage your own schedule, territory, and activity logging",
                "Work directly with the founding team to sharpen the pitch and improve onboarding",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-[14px] font-light leading-relaxed text-[#bbb]">
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[#666]" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-[11px] font-light tracking-[0.3em] text-[#888]">QUALIFICATIONS</p>
            <ul className="mt-5 space-y-3">
              {[
                "Strong interpersonal and communication skills — comfortable walking into a business cold",
                "Self-motivated and able to manage your own time and territory without close supervision",
                "Reliable transportation and willingness to travel locally on a daily basis",
                "A smartphone capable of running the Ventzon app for live demos",
                "Prior experience in sales, retail, hospitality, or any customer-facing role is a plus but not required",
                "A genuine interest in supporting local businesses and communities",
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
            <p className="mt-5 text-[14px] font-light leading-relaxed text-[#bbb]">
              This role is designed as a flexible, commission-based side hustle rather than a traditional full-time position. There is no set schedule — you work when you want, in your own area, at your own pace.
            </p>
            <p className="mt-4 text-[14px] font-light leading-relaxed text-[#bbb]">
              Compensation is <span className="text-[#ededed]">20% of the monthly subscription revenue</span> generated from every merchant you sign up, paid out for the duration of your employment with Ventzon. The more merchants you onboard and keep active, the more you earn — and your book of business grows over time.
            </p>
            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {[
                { label: "20%", detail: "Of monthly subscription revenue per merchant" },
                { label: "Recurring", detail: "Earn every month merchants stay active" },
                { label: "Uncapped", detail: "Your book of business grows over time" },
              ].map(({ label, detail }) => (
                <div key={label} className="rounded-xl border border-[#222] bg-[#0a0a0a] p-5">
                  <p className="text-[20px] font-extralight text-[#ededed]">{label}</p>
                  <p className="mt-1 text-[12px] font-light text-[#999]">{detail}</p>
                </div>
              ))}
            </div>
            <p className="mt-5 text-[13px] font-light leading-relaxed text-[#666]">
              This is a 1099 independent contractor position. Ventzon does not withhold taxes on your behalf — contractors are responsible for managing their own tax obligations.
            </p>
          </div>

          {/* EEO */}
          <div className="rounded-xl border border-[#1a1a1a] bg-[#060606] p-6">
            <p className="text-[11px] font-light leading-relaxed text-[#666]">
              Ventzon is an equal opportunity employer. We celebrate diversity and are committed to creating an inclusive environment for all employees. All qualified applicants will receive consideration without regard to race, color, religion, gender, gender identity, sexual orientation, national origin, disability, age, or veteran status.
            </p>
          </div>

          {/* CTA */}
          <div className="rounded-2xl border border-[#2a2a2a] bg-[#060606] p-8 text-center">
            <p className="text-[18px] font-extralight text-[#ededed]">Sound like you?</p>
            <p className="mt-2 text-[13px] font-light text-[#999]">
              Applications take about 5 minutes. No cover letter required.
            </p>
            <Link
              href="/careers/business-development-representative/apply"
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
