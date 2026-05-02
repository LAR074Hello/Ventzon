import Link from "next/link";

export const metadata = {
  title: "Notification Consent | Ventzon Rewards",
  description:
    "Learn how Ventzon delivers reward notifications to customers.",
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
          Notification Consent
        </h1>
        <p className="mt-4 text-[13px] font-light text-[#555]">
          Last updated: April 30, 2026
        </p>

        <div className="mt-12 space-y-10 text-[15px] font-light leading-[1.8] text-[#999]">
          {/* How consent is collected */}
          <section>
            <h2 className="mb-4 text-lg font-normal tracking-[0.05em] text-[#ededed]">
              How We Deliver Notifications
            </h2>
            <p>
              Ventzon provides a loyalty and rewards platform for participating
              retail businesses. Customers who install the Ventzon app can
              receive push notifications about their visit progress and earned
              rewards. Customers who check in via email also receive
              transactional email updates.
            </p>
            <p className="mt-4">
              Push notifications are enabled at the device level. Customers can
              disable them at any time through their device&rsquo;s notification
              settings.
            </p>
          </section>

          {/* What notifications are sent */}
          <section>
            <h2 className="mb-4 text-lg font-normal tracking-[0.05em] text-[#ededed]">
              What Notifications Are Sent
            </h2>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <strong className="text-[#ededed]">Milestone alerts</strong>{" "}
                &mdash; A push notification when a customer is one visit away
                from earning their reward (e.g., &ldquo;Just 1 more visit to
                earn your reward at Sunrise Bakery.&rdquo;).
              </li>
              <li>
                <strong className="text-[#ededed]">Reward notifications</strong>{" "}
                &mdash; A push notification when the customer earns a reward
                (e.g., &ldquo;You&rsquo;ve earned your reward at Sunrise Bakery!
                Show the app at the register.&rdquo;).
              </li>
              <li>
                <strong className="text-[#ededed]">Email confirmations</strong>{" "}
                &mdash; Transactional emails for customers who check in with an
                email address.
              </li>
            </ul>
            <p className="mt-4">
              Notification frequency depends on customer activity. Typically one
              notification per qualifying event (reward earned or milestone
              reached).
            </p>
          </section>

          {/* Opt-in method */}
          <section>
            <h2 className="mb-4 text-lg font-normal tracking-[0.05em] text-[#ededed]">
              How to Receive Notifications
            </h2>
            <p>
              <strong className="text-[#ededed]">App.</strong>{" "}
              Download the Ventzon app and allow push notifications when
              prompted. Customers can also check in by scanning a QR code at a
              participating store without the app.
            </p>
            <p className="mt-4">
              Customers are not enrolled in notifications without their
              knowledge. Push notifications require explicit permission granted
              by the customer on their device.
            </p>
          </section>

          {/* How to opt out */}
          <section>
            <h2 className="mb-4 text-lg font-normal tracking-[0.05em] text-[#ededed]">
              How to Opt Out
            </h2>
            <p>
              Customers can disable push notifications at any time through their
              device&rsquo;s Settings app under Notifications. Email
              notifications can be unsubscribed from using the unsubscribe link
              in any email, or by contacting support.
            </p>
          </section>

          {/* Contact */}
          <section>
            <h2 className="mb-4 text-lg font-normal tracking-[0.05em] text-[#ededed]">
              Contact
            </h2>
            <p>
              For questions about our notification practices, contact us at{" "}
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
