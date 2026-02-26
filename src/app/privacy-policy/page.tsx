import Link from "next/link";

export const metadata = {
  title: "Privacy Policy — Ventzon",
  description: "How Ventzon collects, uses, and protects your data.",
};

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-[#1a1a1a] p-8 transition-colors duration-500 hover:border-[#222]">
      <h2 className="text-[15px] font-normal tracking-[-0.01em] text-[#ededed]">
        {title}
      </h2>
      <div className="mt-4 space-y-3 text-[14px] font-light leading-[1.8] text-[#666]">
        {children}
      </div>
    </section>
  );
}

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-black px-6 pb-20 pt-28 text-[#ededed]">
      <div className="mx-auto w-full max-w-3xl">
        <p className="text-[11px] font-light tracking-[0.3em] text-[#555]">
          LEGAL
        </p>
        <h1 className="mt-4 text-4xl font-extralight tracking-[-0.02em] text-[#ededed] sm:text-5xl">
          Privacy Policy
        </h1>
        <p className="mt-4 text-[14px] font-light text-[#555]">
          Effective date: February 18, 2026
        </p>

        <div className="mt-12 space-y-6">
          <Section title="Who we are">
            <p>
              Ventzon (&ldquo;we,&rdquo; &ldquo;us,&rdquo; &ldquo;our&rdquo;)
              operates an SMS-based customer rewards platform that helps local
              businesses run loyalty programs. This policy explains what data we
              collect, why we collect it, and how we protect it.
            </p>
          </Section>

          <Section title="Data we collect">
            <p>We collect the minimum data needed to operate the service:</p>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <span className="font-normal text-[#ededed]">
                  Phone number
                </span>{" "}
                — provided when you check in at a participating shop via QR
                code. Used to identify your loyalty account and deliver SMS
                messages.
              </li>
              <li>
                <span className="font-normal text-[#ededed]">
                  Visit history
                </span>{" "}
                — the number of check-ins per shop and the date of each visit.
                Used to track progress toward rewards.
              </li>
              <li>
                <span className="font-normal text-[#ededed]">6-digit PIN</span>{" "}
                — an optional PIN you set for quick re-check-ins. Stored as a
                one-way hash (scrypt); we cannot read your PIN.
              </li>
            </ul>
            <p>
              We do not collect names, email addresses, payment information,
              location data, or device identifiers from customers.
            </p>
          </Section>

          <Section title="How you opt in">
            <p>
              You opt in to Ventzon messaging by scanning a shop&rsquo;s QR code
              and entering your phone number at checkout. By completing a
              check-in, you consent to receive:
            </p>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <span className="font-normal text-[#ededed]">
                  Transactional messages
                </span>{" "}
                — check-in confirmations, visit progress updates, and reward
                redemption texts.
              </li>
              <li>
                <span className="font-normal text-[#ededed]">
                  Promotional messages
                </span>{" "}
                — optional marketing texts sent by the merchant (e.g., deals,
                events, announcements). These are sent only to customers who
                have not opted out.
              </li>
            </ul>
            <p>
              Message frequency varies by shop. Message and data rates may
              apply.
            </p>
          </Section>

          <Section title="How to opt out">
            <p>
              You can stop receiving messages at any time by replying{" "}
              <span className="rounded border border-[#1a1a1a] bg-[#0a0a0a] px-1.5 py-0.5 font-mono text-[13px] text-[#888]">
                STOP
              </span>{" "}
              to any text from Ventzon. Once you opt out, you will not receive
              further transactional or promotional messages from that shop
              unless you re-enroll by checking in again.
            </p>
            <p>
              You may also contact us at{" "}
              <a
                href="mailto:support@ventzon.com"
                className="text-[#ededed] underline underline-offset-4 transition-colors duration-300 hover:text-white"
              >
                support@ventzon.com
              </a>{" "}
              to request removal of your data.
            </p>
          </Section>

          <Section title="How we use your data">
            <ul className="list-disc space-y-2 pl-5">
              <li>
                Delivering check-in confirmations and reward notifications via
                SMS.
              </li>
              <li>
                Tracking visit progress toward each shop&rsquo;s reward goal.
              </li>
              <li>
                Enabling merchants to send promotional messages to opted-in
                customers.
              </li>
              <li>
                Maintaining message logs for delivery tracking and
                troubleshooting.
              </li>
            </ul>
            <p>
              We do not sell, rent, or share your personal data with third
              parties for their own marketing purposes.
            </p>
          </Section>

          <Section title="Third-party services">
            <p>We use the following services to operate the platform:</p>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <span className="font-normal text-[#ededed]">Twilio</span> —
                for sending and receiving SMS messages. Your phone number is
                shared with Twilio solely for message delivery.
              </li>
              <li>
                <span className="font-normal text-[#ededed]">Supabase</span> —
                for secure data storage. Data is encrypted at rest and in
                transit.
              </li>
              <li>
                <span className="font-normal text-[#ededed]">Stripe</span> —
                for processing merchant subscription payments. Ventzon does not
                handle or store merchant payment card data.
              </li>
            </ul>
          </Section>

          <Section title="Data retention">
            <p>
              We retain your phone number and visit history for as long as your
              loyalty account is active with a shop. If you opt out and request
              deletion, we will remove your data within 30 days. Message logs
              may be retained for up to 90 days for delivery troubleshooting.
            </p>
          </Section>

          <Section title="Security">
            <p>
              We protect your data with industry-standard measures including
              encrypted connections (TLS), hashed PINs (scrypt), and
              access-controlled databases. No system is perfectly secure, but we
              take reasonable steps to safeguard your information.
            </p>
          </Section>

          <Section title="Changes to this policy">
            <p>
              We may update this policy from time to time. Material changes will
              be posted on this page with an updated effective date. Continued
              use of the service after changes constitutes acceptance of the
              revised policy.
            </p>
          </Section>

          <Section title="Contact">
            <p>
              Questions about this policy? Reach us at{" "}
              <a
                href="mailto:support@ventzon.com"
                className="text-[#ededed] underline underline-offset-4 transition-colors duration-300 hover:text-white"
              >
                support@ventzon.com
              </a>
              .
            </p>
          </Section>
        </div>

        {/* Footer links */}
        <div className="mt-14 flex items-center justify-between border-t border-[#1a1a1a] pt-8">
          <Link
            href="/"
            className="text-[12px] font-light tracking-[0.1em] text-[#444] transition-colors duration-300 hover:text-[#ededed]"
          >
            &larr; Back to home
          </Link>
          <Link
            href="/terms"
            className="text-[12px] font-light tracking-[0.1em] text-[#444] transition-colors duration-300 hover:text-[#ededed]"
          >
            Terms of Service
          </Link>
        </div>
      </div>
    </main>
  );
}
