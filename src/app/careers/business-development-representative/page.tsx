import Link from "next/link";
import { ArrowRight, MapPin, Clock, DollarSign } from "lucide-react";
import SiteFooter from "@/components/SiteFooter";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Marketing Intern — Ventzon Careers",
  description: "Student internship: earn 50% of every plan you sell — $150 per annual signup, $15/mo recurring. Grow Ventzon on campus and in your city. 1099, uncapped.",
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
            Marketing Intern
          </h1>

          <div className="mt-5 flex flex-wrap items-center gap-5">
            <span className="flex items-center gap-1.5 text-[13px] font-light text-fog-300">
              <MapPin className="h-3.5 w-3.5" /> Your city — on campus & local
            </span>
            <span className="flex items-center gap-1.5 text-[13px] font-light text-fog-300">
              <Clock className="h-3.5 w-3.5" /> Flexible, around your classes
            </span>
            <span className="flex items-center gap-1.5 text-[13px] font-light text-fog-300">
              <DollarSign className="h-3.5 w-3.5" /> 50% commission, uncapped
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
            <p className="text-[11px] font-light tracking-[0.3em] text-fog-300">ABOUT VENTZON</p>
            <p className="mt-5 text-[15px] font-light leading-relaxed text-fog-200">
              Ventzon is a local rewards and community app that helps people discover great spots near them, earn rewards for showing up, and support the independent local businesses that make their neighborhoods unique. We&apos;re an early-stage startup growing city by city, and we&apos;re building our presence with student interns who know their community best.
            </p>
          </div>

          <div>
            <p className="text-[11px] font-light tracking-[0.3em] text-fog-300">ABOUT THE ROLE</p>
            <p className="mt-5 text-[15px] font-light leading-relaxed text-fog-200">
              As a Marketing Intern, you&apos;ll be the face of Ventzon in your city — both on campus and out in the local community. You&apos;ll grow our user base among students and residents, and sign up local businesses across the area. It&apos;s an entrepreneurial, flexible role for someone who wants real sales and marketing experience at an early-stage startup, on their own schedule.
            </p>
          </div>

          <div>
            <p className="text-[11px] font-light tracking-[0.3em] text-fog-300">WHAT YOU&apos;LL DO</p>
            <ul className="mt-5 space-y-3">
              {[
                "Promote Ventzon on campus and around your city — events, social media, local partnerships, and word of mouth",
                "Sign up local businesses throughout the area to offer rewards through Ventzon",
                "Grow sign-ups and keep the community engaged",
                "Represent the Ventzon brand and share feedback from users and local business owners",
                "Hit simple weekly and monthly growth goals",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-[14px] font-light leading-relaxed text-fog-200">
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[#666]" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-[11px] font-light tracking-[0.3em] text-fog-300">WHAT YOU&apos;LL GAIN</p>
            <ul className="mt-5 space-y-3">
              {[
                "Hands-on sales and marketing experience that stands out on a resume",
                "Direct startup exposure and mentorship from the founder",
                "Flexible hours that work around your class schedule",
                "Room to grow into a lead or regional role",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-[14px] font-light leading-relaxed text-fog-200">
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[#666]" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-[11px] font-light tracking-[0.3em] text-fog-300">WHO WE&apos;RE LOOKING FOR</p>
            <ul className="mt-5 space-y-3">
              {[
                "Current student who's outgoing, reliable, and self-motivated",
                "Interested in marketing, sales, entrepreneurship, or business",
                "A strong communicator, comfortable talking to both students and business owners",
                "Goal-oriented — no prior experience required",
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
              This is a <span className="text-fog-100">50% commission internship (1099) with uncapped earning potential</span> — you earn half of every plan you sell. That&apos;s <span className="text-fog-100">$150 per annual signup</span> (50% of the $300/year plan) and <span className="text-fog-100">$15/month recurring</span> on monthly plans, for as long as that business stays on Ventzon.
            </p>
            <p className="mt-4 text-[14px] font-light leading-relaxed text-fog-200">
              On-target earnings are <span className="text-fog-100">~$750–$1,000/month</span> for solid performers, and top reps earn more.
            </p>
            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {[
                { label: "50%", detail: "Of every plan you sell — uncapped" },
                { label: "$150", detail: "Per annual signup (50% of the $300/yr plan)" },
                { label: "$15/mo", detail: "Recurring on monthly plans, for as long as they stay" },
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

          {/* How to Apply */}
          <div>
            <p className="text-[11px] font-light tracking-[0.3em] text-fog-300">HOW TO APPLY</p>
            <p className="mt-5 text-[15px] font-light leading-relaxed text-fog-200">
              Apply directly on our website — reach out with a short note on why you&apos;d be a great fit. We&apos;d love to hear from you!
            </p>
          </div>

          {/* CTA */}
          <div className="rounded-2xl border border-night-600 bg-[#060606] p-8 text-center">
            <p className="text-[18px] font-light text-fog-100">Sound like you?</p>
            <p className="mt-2 text-[13px] font-light text-[#999]">
              Send a short note on why you&apos;d be a great fit — we&apos;d love to hear from you.
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
