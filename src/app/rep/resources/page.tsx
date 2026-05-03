import { BookOpen, MessageSquare, Zap, HelpCircle } from "lucide-react";

const sections = [
  {
    icon: Zap,
    title: "The 2-minute pitch",
    body: `Walk in, introduce yourself: "Hey, I'm with Ventzon — we help local businesses like yours run a loyalty program. Totally digital, no hardware, no monthly fees on the free plan. Customers scan a QR code, collect stamps, earn a reward. Takes about 5 minutes to set up. Want me to show you how it looks?"`,
  },
  {
    icon: MessageSquare,
    title: "Common objections",
    items: [
      { q: "\"We already have a loyalty program\"", a: "That's great — Ventzon replaces paper punch cards and works automatically. No manual tracking, no lost cards, and you get to see who your regulars actually are." },
      { q: "\"We're too busy right now\"", a: "Totally understand. Setup takes 5 minutes and I can do it while you serve customers. You don't need to stop what you're doing." },
      { q: "\"How much does it cost?\"", a: "Free plan is completely free — you only pay $1.25 per reward redeemed. Pro plan is $25/month and adds analytics, campaigns, and priority support." },
      { q: "\"We're not very tech savvy\"", a: "That's exactly who this is built for. There's nothing to install — just a QR code you print and put on your counter. Customers do the rest." },
    ],
  },
  {
    icon: BookOpen,
    title: "Onboarding checklist",
    items: [
      { q: "1. Create their account", a: "Go to ventzon.com/merchant with the owner. Click \"Get started free\" and create their account." },
      { q: "2. Set up their reward", a: "Choose how many visits = a reward, and what the reward is. E.g. \"Buy 8 coffees, get 1 free.\"" },
      { q: "3. Download the QR code", a: "From their dashboard, download and print their unique QR code. Put it somewhere visible at the register." },
      { q: "4. Test it", a: "Have the owner scan it with their own phone to confirm it works. Show them what the customer sees." },
      { q: "5. Log the merchant", a: "Go to your rep portal → Log a Merchant → enter their shop slug to add them to your book." },
    ],
  },
  {
    icon: HelpCircle,
    title: "Need help?",
    body: "Text or message Luke directly. He's your main point of contact for anything — product questions, merchant issues, commission questions, whatever.",
    contact: "lukerichards@ventzon.com",
  },
];

export default function ResourcesPage() {
  return (
    <div className="min-h-full bg-black">
      <div className="px-5 pb-4" style={{ paddingTop: "calc(env(safe-area-inset-top, 20px) + 20px)" }}>
        <h1 className="text-[22px] font-extralight text-[#ededed]">Resources</h1>
        <p className="mt-1 text-[13px] font-light text-[#444]">Sales guides and onboarding help</p>
      </div>

      <div className="px-5 pb-8 space-y-4">
        {sections.map(section => (
          <div key={section.title} className="rounded-2xl border border-[#1a1a1a] bg-[#080808] p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[#222]">
                <section.icon className="h-4 w-4 text-[#555]" />
              </div>
              <p className="text-[14px] font-light text-[#ededed]">{section.title}</p>
            </div>

            {"body" in section && section.body && (
              <p className="text-[13px] font-light leading-relaxed text-[#888]">{section.body}</p>
            )}

            {"contact" in section && section.contact && (
              <a
                href={`mailto:${section.contact}`}
                className="mt-3 inline-block text-[13px] font-light text-[#ededed] underline underline-offset-2"
              >
                {section.contact}
              </a>
            )}

            {"items" in section && section.items && (
              <div className="space-y-4">
                {section.items.map((item, i) => (
                  <div key={i}>
                    <p className="text-[13px] font-light text-[#bbb]">{item.q}</p>
                    <p className="mt-1 text-[13px] font-light leading-relaxed text-[#666]">{item.a}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
