import Link from "next/link";
import { ArrowRight, MapPin, Clock, DollarSign } from "lucide-react";
import SiteFooter from "@/components/SiteFooter";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Business Development Representative Intern — Ventzon Careers",
  description: "College students: earn 40% monthly recurring commission signing up local businesses. 1099 independent contractor. Set your own schedule.",
};

export default function BDRPage() {
  return (
    <main className="marketing min-h-screen bg-night-950 text-fog-100">

      {/* Hero */}
      <section className="px-8 pb-12 pt-40">
        <div className="mx-auto max-w-3xl">
          <Link
            href="/careers"
            className="text-[11px] font-light tracking-[0.3em] text-[#777] transition-colors hover:text-fog-300"
          >
            ← CAREERS
          </Link>

          <div className="mt-6 flex items-center gap-2.5">
            <span className="rounded-full border border-emerald-800/50 bg-emerald-950/30 px-2.5 py-1 text-[10px] font-light tracking-[0.15em] text-emerald-400">
              OPEN
            </span>
            <span className="text-[10px] font-light tracking-[0.15em] text-[#777]">1099 INDEPENDENT CONTRACTOR</span>
          </div>

          <h1 className="mt-4 text-4xl font-light tracking-[0.02em] text-fog-100 sm:text-5xl">
            Business Development<br />Representative Intern
          </h1>

          <div className="mt-5 flex flex-wrap items-center gap-5">
            <span className="flex items-center gap-1.5 text-[13px] font-light text-fog-300">
              <MapPin className="h-3.5 w-3.5" /> Your city (field-based)
            </span>
            <span className="flex items-center gap-1.5 text-[13px] font-light text-fog-300">
              <Clock className="h-3.5 w-3.5" /> Set your own schedule
            </span>
            <span className="flex items-center gap-1.5 text-[13px] font-light text-fog-300">
              <DollarSign className="h-3.5 w-3.5" /> 40% monthly recurring commission
            </span>
          </div>

          <Link
            href="/careers/business-development-representative/apply"
            className="mt-8 inline-flex items-center gap-2.5 rounded-full border border-fog-100 px-8 py-3.5 text-[12px] font-light tracking-[0.15em] text-fog-100 transition-all duration-300 hover:bg-fog-100 hover:text-black"
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
            <p className="text-[11px] font-light tracking-[0.3em] text-fog-300">ABOUT THE COMPANY</p>
            <p className="mt-5 text-[15px] font-light leading-relaxed text-fog-200">
              Ventzon is a loyalty rewards platform built for independent local businesses. We give coffee shops, barbershops, gyms, restaurants, and other local businesses a simple digital loyalty program — no hardware, no setup fees, and no technical knowledge required.
            </p>
            <p className="mt-4 text-[15px] font-light leading-relaxed text-fog-200">
              Customers check in by scanning a QR code, collect stamps, and earn rewards. We're an early-stage startup growing fast and looking for driven people to help us build something that genuinely helps local communities.
            </p>
          </div>

          <div>
            <p className="text-[11px] font-light tracking-[0.3em] text-fog-300">ABOUT THE ROLE</p>
            <p className="mt-5 text-[15px] font-light leading-relaxed text-fog-200">
              This is a school-year role for college students, freshman through senior. You'll walk into local businesses near your campus, introduce owners to Ventzon, and run a live demo on the spot. You set your own schedule around classes, own your own territory, and operate as a 1099 independent contractor — commission-only, no guaranteed pay.
            </p>
            <p className="mt-4 text-[15px] font-light leading-relaxed text-fog-200">
              Once a merchant is interested, you'll guide them through onboarding — setting up their account, configuring their reward program, and making sure their QR code is live and working before you leave.
            </p>
            <p className="mt-4 text-[15px] font-light leading-relaxed text-fog-200">
              Beyond the initial sale, you'll be the primary point of contact for your merchants — following up regularly, answering questions, and making sure they're getting real value out of the platform.
            </p>
          </div>

          <div>
            <p className="text-[11px] font-light tracking-[0.3em] text-fog-300">WHAT YOU'LL DO</p>
            <ul className="mt-5 space-y-3">
              {[
                "Walk into local businesses near your campus and introduce them to Ventzon face-to-face",
                "Run a live demo on the spot and sign owners up during the visit",
                "Set up new merchants — account, reward program, QR code live in-store",
                "Follow up with your merchants and stay their point of contact",
                "Own your territory and your schedule — fit Ventzon around classes",
                "Work directly with the founding team to sharpen the pitch and onboarding",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-[14px] font-light leading-relaxed text-fog-200">
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[#666]" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-[11px] font-light tracking-[0.3em] text-fog-300">QUALIFICATIONS</p>
            <ul className="mt-5 space-y-3">
              {[
                "A current college student — freshman through senior, any major",
                "Comfortable walking into a business and starting a conversation",
                "A self-starter who manages their own territory without hand-holding",
                "Reliable transportation to visit local businesses in person",
                "A smartphone capable of running the Ventzon app for live demos",
                "18 or older",
                "Prior customer-facing experience is a plus but not required",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-[14px] font-light leading-relaxed text-fog-200">
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[#666]" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-[11px] font-light tracking-[0.3em] text-fog-300">COMPENSATION</p>
            <p className="mt-5 text-[14px] font-light leading-relaxed text-fog-200">
              This is a 1099 independent contractor engagement, commission-only. You set your own schedule and your own territory — the more merchants you sign, the more you earn, with no ceiling.
            </p>
            <p className="mt-4 text-[14px] font-light leading-relaxed text-fog-200">
              You earn <span className="text-fog-100">40% of each merchant's monthly subscription, every month, for as long as that merchant stays subscribed.</span> Paid out every two weeks.
            </p>
            <p className="mt-4 text-[14px] font-light leading-relaxed text-fog-200">
              The math is simple: a merchant on the $25/month plan is <span className="text-fog-100">$10 a month</span> for you. Sign a shop in September and it pays you every month after — October, November, December, and on. That's the compounding part: shops you bring in early in the semester are still paying you when you're juggling finals.
            </p>
            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {[
                { label: "40%", detail: "Of each merchant's monthly subscription" },
                { label: "Recurring", detail: "Every month the merchant stays subscribed" },
                { label: "Paid every two weeks", detail: "Fixed payout cadence" },
              ].map(({ label, detail }) => (
                <div key={label} className="rounded-xl border border-[#222] bg-night-900 p-5">
                  <p className="text-[20px] font-light text-fog-100">{label}</p>
                  <p className="mt-1 text-[12px] font-light text-[#999]">{detail}</p>
                </div>
              ))}
            </div>
            <p className="mt-5 text-[13px] font-light leading-relaxed text-fog-500">
              This is a 1099 independent contractor position. Ventzon does not withhold taxes on your behalf — contractors are responsible for managing their own tax obligations.
            </p>
          </div>

          {/* EEO */}
          <div className="rounded-xl border border-night-700 bg-[#060606] p-6">
            <p className="text-[11px] font-light leading-relaxed text-fog-500">
              Ventzon is an equal opportunity employer. We celebrate diversity and are committed to creating an inclusive environment for all employees. All qualified applicants will receive consideration without regard to race, color, religion, gender, gender identity, sexual orientation, national origin, disability, age, or veteran status.
            </p>
          </div>

          {/* CTA */}
          <div className="rounded-2xl border border-night-600 bg-[#060606] p-8 text-center">
            <p className="text-[18px] font-light text-fog-100">Sound like you?</p>
            <p className="mt-2 text-[13px] font-light text-[#999]">
              Applications take about 5 minutes. No cover letter required.
            </p>
            <Link
              href="/careers/business-development-representative/apply"
              className="mt-6 inline-flex items-center gap-2.5 rounded-full border border-fog-100 px-8 py-3.5 text-[12px] font-light tracking-[0.15em] text-fog-100 transition-all duration-300 hover:bg-fog-100 hover:text-black"
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
