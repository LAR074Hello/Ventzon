import Link from "next/link";

export const metadata = {
  title: "SMS Opt-In & Consent | Ventzon Rewards",
  description:
    "Learn how Ventzon collects consent for SMS reward notifications.",
};

export default function OptInPage() {
  return (
    <main className="min-h-screen bg-black text-[#ededed]">
      <div className="mx-auto max-w-2xl px-8 py-20 sm:py-28">
        <Link
          href="/"
          className="text-[11px] font-light tracking-[0.3em] text-[#555] transition-colors hover:text-[#ededed]"
        >
          &larr; VENTZON
        </Link>

        <h1 className="mt-10 text-3xl font-extralight tracking-[-0.02em] sm:text-4xl">
          SMS Opt-In &amp; Consent
        </h1>
        <p className="mt-4 text-[13px] font-light text-[#555]">
          Last updated: March 24, 2026
        </p>

        <div className="mt-12 space-y-10 text-[15px] font-light leading-[1.8] text-[#999]">
          {/* How consent is collected */}
          <section>
            <h2 className="mb-4 text-lg font-normal tracking-[0.05em] text-[#ededed]">
              How We Collect Consent
            </h2>
            <p>
              Ventzon provides a loyalty and rewards platform for participating
              retail businesses. Customers voluntarily opt in to receive SMS
              messages by scanning a QR code displayed at a participating
              store&rsquo;s register and entering their phone number on our
              check-in page.
            </p>
            <p className="mt-4">
              The check-in page clearly states:{" "}
              <em className="text-[#ededed]">
                &ldquo;By checking in you agree to receive reward
                notifications. Reply STOP to opt out.&rdquo;
              </em>
            </p>
          </section>

          {/* What messages are sent */}
          <section>
            <h2 className="mb-4 text-lg font-normal tracking-[0.05em] text-[#ededed]">
              What Messages Are Sent
            </h2>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <strong className="text-[#ededed]">Check-in confirmations</strong>{" "}
                &mdash; A brief SMS confirming the customer&rsquo;s visit and
                showing their progress toward a reward (e.g., &ldquo;Checked in
                at Sunrise Bakery. You&rsquo;re at 5/8 visits.&rdquo;).
              </li>
              <li>
                <strong className="text-[#ededed]">Reward notifications</strong>{" "}
                &mdash; A message when the customer earns a reward (e.g.,
                &ldquo;You qualify for a free pastry at Sunrise Bakery!
                Show this message to redeem.&rdquo;).
              </li>
              <li>
                <strong className="text-[#ededed]">Promotional messages</strong>{" "}
                &mdash; Occasional offers or updates from the participating
                store (Pro plan merchants only).
              </li>
            </ul>
            <p className="mt-4">
              Message frequency varies based on customer activity. Typically 1
              message per check-in visit. Message and data rates may apply.
            </p>
          </section>

          {/* Opt-in method */}
          <section>
            <h2 className="mb-4 text-lg font-normal tracking-[0.05em] text-[#ededed]">
              Opt-In Method
            </h2>
            <p>
              <strong className="text-[#ededed]">Mobile / QR Code.</strong>{" "}
              Customers scan a QR code physically displayed at a participating
              retail location. The QR code directs them to a mobile web page
              where they enter their phone number and submit. No app download
              is required.
            </p>
            <p className="mt-4">
              Consent is collected at the point of check-in. Customers are not
              pre-enrolled or added without their knowledge. Each customer
              must actively enter their own phone number and tap
              &ldquo;Check In&rdquo; to opt in.
            </p>
          </section>

          {/* How to opt out */}
          <section>
            <h2 className="mb-4 text-lg font-normal tracking-[0.05em] text-[#ededed]">
              How to Opt Out
            </h2>
            <p>
              Customers can opt out at any time by replying{" "}
              <strong className="text-[#ededed]">STOP</strong> to any message.
              They will receive a confirmation and no further messages will be
              sent. Customers can also reply{" "}
              <strong className="text-[#ededed]">HELP</strong> for support
              information.
            </p>
          </section>

          {/* Contact */}
          <section>
            <h2 className="mb-4 text-lg font-normal tracking-[0.05em] text-[#ededed]">
              Contact
            </h2>
            <p>
              For questions about our messaging practices, contact us at{" "}
              <a
                href="mailto:lukerichards@ventzon.com"
                className="text-[#ededed] underline underline-offset-4 transition-colors hover:text-white"
              >
                lukerichards@ventzon.com
              </a>
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
