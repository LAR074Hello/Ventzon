"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, MessageCircle, Smartphone, Store, Star, ShieldCheck } from "lucide-react";
import SiteFooter from "@/components/SiteFooter";

type FAQ = { q: string; a: string };

const customerFaqs: FAQ[] = [
  {
    q: "What is Ventzon?",
    a: "A local social app. Discover real places near you, see what they're actually like from people who went, check in when you're there, and share where you've been.",
  },
  {
    q: "Is Ventzon free for customers?",
    a: "Yes — completely free. There are no fees, subscriptions, or in-app purchases for customers.",
  },
  {
    q: "How do I find places near me?",
    a: "Open the app and browse the Explore feed, or tap Map to see real local spots around you — coffee shops, parks, bookshops, and more.",
  },
  {
    q: "What is a verified visit?",
    a: "When you check in at a place and post about it, your post carries a verified visit badge — proof you were actually there, not a review from someone who wasn't.",
  },
  {
    q: "How do I post?",
    a: "Tap the + button in the middle of the bottom bar, pick a place, write a caption, and add a photo or video. Your friends see it first.",
  },
  {
    q: "How do I follow friends?",
    a: "Search for their name on Explore, open their profile, and tap Follow. Once you follow them, their posts show up in your feed.",
  },
  {
    q: "How do I delete a post or comment?",
    a: "Open your post and tap the trash icon. To delete a comment, open the comments sheet and tap the trash on your own comment — or on any comment on a post you wrote.",
  },
  {
    q: "What are loyalty cards?",
    a: "Some shops on Ventzon run a loyalty program — check in often enough and you earn a reward. They appear under the Rewards tab. If a shop doesn't run one, there's no card, and that's normal.",
  },
  {
    q: "How do I delete my account?",
    a: "Go to Profile → Settings → Delete account. This permanently removes your account and all associated data. This action cannot be undone.",
  },
];

const merchantFaqs: FAQ[] = [
  {
    q: "How does billing work?",
    a: "Ventzon Pro is $25/month or $240/year (save $60), flat — no per-redemption fees, no setup fees. Cancel anytime.",
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
      className="w-full text-left border-b border-night-700 last:border-0"
    >
      <div className="flex items-start justify-between gap-4 py-5">
        <span className="text-[15px] font-medium text-[#e5e5e5] leading-snug">{faq.q}</span>
        <ChevronDown
          className="mt-0.5 h-4 w-4 shrink-0 text-fog-500 transition-transform duration-200"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </div>
      {open && (
        <p className="pb-5 text-[14px] font-normal leading-relaxed text-fog-300">{faq.a}</p>
      )}
    </button>
  );
}

export default function HelpPage() {
  const [active, setActive] = useState<"customers" | "merchants">("customers");

  const activeCat = categories.find((c) => c.id === active)!;

  return (
    <div className="min-h-screen bg-night-950 text-white">
      {/* Hero */}
      <section className="border-b border-night-800 px-6 py-20 text-center">
        <div className="mx-auto max-w-xl">
          <div className="mb-5 inline-flex items-center justify-center rounded-2xl border border-[#1f1f1f] bg-[#0d0d0d] p-4">
            <MessageCircle className="h-7 w-7 text-fog-100" />
          </div>
          <h1 className="text-[40px] font-semibold tracking-[-0.03em] text-[#f5f5f5]">
            Help &amp; FAQ
          </h1>
          <p className="mt-3 text-[16px] font-normal leading-relaxed text-fog-500">
            Everything you need to know about Ventzon — for customers and merchants.
          </p>
        </div>
      </section>

      {/* Category tabs */}
      <div className="sticky top-0 z-10 border-b border-night-800 bg-night-950/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-2xl gap-1 px-6 py-3">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                onClick={() => setActive(cat.id as any)}
                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-medium transition-colors ${
                  active === cat.id
                    ? "bg-fog-100 text-black"
                    : "text-fog-500 hover:text-fog-300"
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
        <div className="rounded-2xl border border-night-700 bg-night-950 px-6">
          {activeCat.faqs.map((faq, i) => (
            <FAQItem key={i} faq={faq} />
          ))}
        </div>
      </section>

      {/* Contact section */}
      <section className="mx-auto max-w-2xl px-6 pb-20">
        <div className="rounded-2xl border border-night-700 bg-night-900 px-6 py-8 text-center">
          <div className="mb-4 inline-flex items-center justify-center rounded-xl border border-[#1f1f1f] bg-night-800 p-3">
            <MessageCircle className="h-5 w-5 text-fog-300" />
          </div>
          <h2 className="text-[18px] font-semibold text-[#f0f0f0]">Still have questions?</h2>
          <p className="mt-2 text-[14px] text-fog-500">
            We're here to help. Send us a message and we'll get back to you within one business day.
          </p>
          <a
            href="mailto:support@ventzon.com"
            className="mt-5 inline-block rounded-xl bg-fog-100 px-6 py-3 text-[13px] font-semibold tracking-wide text-black transition-colors hover:bg-white"
          >
            Email support
          </a>
          {active === "merchants" && (
            <div className="mt-4">
              <Link
                href="/get-started"
                className="text-[13px] font-medium text-fog-500 underline-offset-2 hover:text-fog-300 hover:underline"
              >
                Ready to get started? Set up your loyalty program →
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Quick links */}
      <section className="border-t border-night-800 px-6 py-12">
        <div className="mx-auto grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Open the app", href: "/customer/explore", icon: Smartphone },
            { label: "How it works", href: "/how-it-works", icon: Star },
            { label: "For shops", href: "/app", icon: Store },
            { label: "Privacy policy", href: "/privacy-policy", icon: ShieldCheck },
          ].map(({ label, href, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-2 rounded-2xl border border-night-700 bg-night-950 py-5 text-center transition-colors hover:border-night-600"
            >
              <Icon className="h-5 w-5 text-fog-600" />
              <span className="text-[12px] font-medium text-fog-500">{label}</span>
            </Link>
          ))}
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
