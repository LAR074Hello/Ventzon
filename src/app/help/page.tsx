"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, MessageCircle, Smartphone, Store, CreditCard, Star, ShieldCheck } from "lucide-react";
import SiteFooter from "@/components/SiteFooter";

type FAQ = { q: string; a: string };

const customerFaqs: FAQ[] = [
  {
    q: "How do I earn stamps?",
    a: "Visit any participating Ventzon store and ask them to scan your QR code at checkout. Each qualifying visit adds one stamp to your card. You can find your QR code in the Ventzon app under the Scan tab.",
  },
  {
    q: "How do I redeem my reward?",
    a: "When you've collected enough stamps, you'll see a gold 'Reward ready!' banner on your home screen. Open the card and show it to the cashier at the register — they'll mark it as redeemed and your card will reset for the next round.",
  },
  {
    q: "Can I earn more than one stamp per day?",
    a: "Each store limits stamps to one per day. This keeps the program fair for everyone and ensures rewards reflect genuine repeat visits.",
  },
  {
    q: "Do my stamps expire?",
    a: "Stamps are tied to your account and don't expire as long as your account is active. If a merchant closes or leaves Ventzon, any unredeemed stamps on that card will remain visible but cannot be redeemed.",
  },
  {
    q: "How do I join a loyalty program?",
    a: "You can join two ways: scan the QR code posted in-store with the Ventzon app, or search for the store on the Explore tab and tap 'Join.' Your card will appear instantly in My Cards.",
  },
  {
    q: "Is Ventzon free for customers?",
    a: "Yes — the Ventzon app is completely free to download and use. There are no fees, subscriptions, or in-app purchases for customers.",
  },
  {
    q: "What happens if I get a new phone?",
    a: "Your account and all your stamps are stored in the cloud, not on your device. Just sign in on your new phone and everything will be waiting for you.",
  },
  {
    q: "How do I delete my account?",
    a: "Go to the Profile tab → scroll to the bottom → tap 'Delete account.' This permanently removes your account and all associated data. This action cannot be undone.",
  },
];

const merchantFaqs: FAQ[] = [
  {
    q: "How does billing work?",
    a: "Ventzon Pro is $25/month or $240/year (save $60). You're also charged $0.85 per reward redemption — meaning you only pay when a customer actually earns their reward. There are no setup fees and you can cancel anytime.",
  },
  {
    q: "Do I need any hardware or a POS system?",
    a: "No hardware required. You stamp customers directly from your merchant dashboard on any phone, tablet, or computer. Just log in at ventzon.com/merchant and use the Manual Stamp tool.",
  },
  {
    q: "How do customers join my loyalty program?",
    a: "Print or display your unique QR code in-store — customers scan it with the Ventzon app to join instantly. You can also share your join link online (social media, Google Business, etc.).",
  },
  {
    q: "Can I customize the reward?",
    a: "Yes. You can set the number of visits required (2-12), write a custom deal title (e.g. 'Free coffee after 8 visits'), and add deal details customers will see in the app.",
  },
  {
    q: "How do I see who my customers are?",
    a: "Your dashboard includes a full Customer List with every member's name, email, visit count, and join date. You can also export the list as a CSV for use in other tools.",
  },
  {
    q: "What are email campaigns?",
    a: "Pro merchants can send promotional emails to their entire customer list directly from the dashboard. Use them for limited-time offers, new menu items, or event announcements.",
  },
  {
    q: "What happens when a customer redeems a reward?",
    a: "The customer shows you their 'Reward ready' screen. You click 'Mark as redeemed' in your dashboard (or they can show you the screen and you manually confirm). Their card resets to zero stamps automatically.",
  },
  {
    q: "Can I pause or cancel my subscription?",
    a: "Yes. You can cancel anytime from your merchant dashboard under Account settings. Cancellation takes effect at the end of your current billing period and your data is retained for 30 days.",
  },
  {
    q: "Is there a free trial?",
    a: "We don't currently offer a free trial, but the $25/month plan has no long-term commitment — cancel anytime within the first month if it's not a fit.",
  },
];

const categories = [
  { id: "customers", label: "For customers", icon: Smartphone, faqs: customerFaqs },
  { id: "merchants", label: "For merchants", icon: Store, faqs: merchantFaqs },
];

function FAQItem({ faq }: { faq: FAQ }) {
  const [open, setOpen] = useState(false);
  return (
    <button
      onClick={() => setOpen((o) => !o)}
      className="w-full text-left border-b border-[#1a1a1a] last:border-0"
    >
      <div className="flex items-start justify-between gap-4 py-5">
        <span className="text-[15px] font-medium text-[#e5e5e5] leading-snug">{faq.q}</span>
        <ChevronDown
          className="mt-0.5 h-4 w-4 shrink-0 text-[#555] transition-transform duration-200"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </div>
      {open && (
        <p className="pb-5 text-[14px] font-normal leading-relaxed text-[#888]">{faq.a}</p>
      )}
    </button>
  );
}

export default function HelpPage() {
  const [active, setActive] = useState<"customers" | "merchants">("customers");

  const activeCat = categories.find((c) => c.id === active)!;

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero */}
      <section className="border-b border-[#111] px-6 py-20 text-center">
        <div className="mx-auto max-w-xl">
          <div className="mb-5 inline-flex items-center justify-center rounded-2xl border border-[#1f1f1f] bg-[#0d0d0d] p-4">
            <MessageCircle className="h-7 w-7 text-[#ededed]" />
          </div>
          <h1 className="text-[40px] font-semibold tracking-[-0.03em] text-[#f5f5f5]">
            Help &amp; FAQ
          </h1>
          <p className="mt-3 text-[16px] font-normal leading-relaxed text-[#666]">
            Everything you need to know about Ventzon — for customers and merchants.
          </p>
        </div>
      </section>

      {/* Category tabs */}
      <div className="sticky top-0 z-10 border-b border-[#111] bg-black/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-2xl gap-1 px-6 py-3">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                onClick={() => setActive(cat.id as any)}
                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-medium transition-colors ${
                  active === cat.id
                    ? "bg-[#ededed] text-black"
                    : "text-[#666] hover:text-[#aaa]"
                }`}
              >
                <Icon className="h-4 w-4" />
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* FAQ list */}
      <section className="mx-auto max-w-2xl px-6 py-10">
        <div className="rounded-2xl border border-[#1a1a1a] bg-[#080808] px-6">
          {activeCat.faqs.map((faq, i) => (
            <FAQItem key={i} faq={faq} />
          ))}
        </div>
      </section>

      {/* Contact section */}
      <section className="mx-auto max-w-2xl px-6 pb-20">
        <div className="rounded-2xl border border-[#1a1a1a] bg-[#0a0a0a] px-6 py-8 text-center">
          <div className="mb-4 inline-flex items-center justify-center rounded-xl border border-[#1f1f1f] bg-[#111] p-3">
            <MessageCircle className="h-5 w-5 text-[#888]" />
          </div>
          <h2 className="text-[18px] font-semibold text-[#f0f0f0]">Still have questions?</h2>
          <p className="mt-2 text-[14px] text-[#666]">
            We're here to help. Send us a message and we'll get back to you within one business day.
          </p>
          <a
            href="mailto:support@ventzon.com"
            className="mt-5 inline-block rounded-xl bg-[#ededed] px-6 py-3 text-[13px] font-semibold tracking-wide text-black transition-colors hover:bg-white"
          >
            Email support
          </a>
          {active === "merchants" && (
            <div className="mt-4">
              <Link
                href="/get-started"
                className="text-[13px] font-medium text-[#555] underline-offset-2 hover:text-[#888] hover:underline"
              >
                Ready to get started? Set up your loyalty program →
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Quick links */}
      <section className="border-t border-[#111] px-6 py-12">
        <div className="mx-auto grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Pricing", href: "/pricing", icon: CreditCard },
            { label: "App download", href: "/app", icon: Smartphone },
            { label: "How it works", href: "/how-it-works", icon: Star },
            { label: "Privacy policy", href: "/privacy-policy", icon: ShieldCheck },
          ].map(({ label, href, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-2 rounded-2xl border border-[#1a1a1a] bg-[#080808] py-5 text-center transition-colors hover:border-[#2a2a2a]"
            >
              <Icon className="h-5 w-5 text-[#444]" />
              <span className="text-[12px] font-medium text-[#666]">{label}</span>
            </Link>
          ))}
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
