import Link from "next/link";

export const metadata = {
  title: "Terms of Service — Ventzon",
  description:
    "Terms and conditions for using the Ventzon rewards platform.",
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

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-black px-6 pb-20 pt-28 text-[#ededed]">
      <div className="mx-auto w-full max-w-3xl">
        <p className="text-[11px] font-light tracking-[0.3em] text-[#555]">
          LEGAL
        </p>
        <h1 className="mt-4 text-4xl font-extralight tracking-[-0.02em] text-[#ededed] sm:text-5xl">
          Terms of Service
        </h1>
        <p className="mt-4 text-[14px] font-light text-[#555]">
          Effective date: February 18, 2026
        </p>

        <div className="mt-12 space-y-6">
          <Section title="Acceptance of terms">
            <p>
              By using Ventzon (&ldquo;the Service&rdquo;), you agree to these
              Terms of Service. If you do not agree, do not use the Service.
              These terms apply to all users including customers who check in at
              participating shops and merchants who operate loyalty programs
              through Ventzon.
            </p>
          </Section>

          <Section title="Description of service">
            <p>
              Ventzon is a loyalty and rewards platform for local businesses.
              Merchants create reward programs tied to a QR code. Customers scan
              the code, check in via the app or web, and receive push
              notifications tracking their visit progress and reward eligibility.
            </p>
          </Section>

          <Section title="Customer notification terms">
            <p>
              By checking in at a participating shop and installing the Ventzon
              app, you may receive push notifications from Ventzon on behalf of
              that shop. These notifications include:
            </p>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <span className="font-normal text-[#ededed]">
                  Reward notifications
                </span>{" "}
                — alerts when you earn a reward or reach a milestone.
              </li>
              <li>
                <span className="font-normal text-[#ededed]">
                  Email confirmations
                </span>{" "}
                — transactional emails for customers who check in with an email
                address.
              </li>
            </ul>
            <p>
              You can opt out of push notifications at any time in your
              device&rsquo;s notification settings. To unsubscribe from email
              notifications, use the unsubscribe link in any email or contact
              support.
            </p>
          </Section>

          <Section title="Merchant responsibilities">
            <p>Merchants using Ventzon agree to:</p>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                Use the platform only for lawful loyalty and marketing purposes.
              </li>
              <li>
                Send promotional messages only to customers who have opted in
                through the QR check-in process.
              </li>
              <li>
                Not send misleading, deceptive, or offensive content through
                promotional messages.
              </li>
              <li>
                Comply with all applicable laws and regulations including
                CAN-SPAM and applicable consumer protection laws.
              </li>
              <li>
                Maintain a valid subscription to access paid features of the
                platform.
              </li>
            </ul>
          </Section>

          <Section title="Accounts and access">
            <p>
              Merchants create an account to manage their shop and rewards
              program. You are responsible for maintaining the security of your
              account credentials. Customers do not need to create an account;
              they are identified by phone number and an optional 6-digit PIN.
            </p>
            <p>
              We reserve the right to suspend or terminate access to the Service
              for violation of these terms or for any conduct that we determine,
              in our sole discretion, to be harmful to other users or the
              platform.
            </p>
          </Section>

          <Section title="Subscription and payments">
            <p>
              Merchant access to Ventzon requires a paid subscription processed
              through Stripe. Subscription details, pricing, and billing cycles
              are presented at the time of purchase. Refunds are handled on a
              case-by-case basis. We reserve the right to change pricing with
              reasonable notice.
            </p>
          </Section>

          <Section title="Data and privacy">
            <p>
              Your use of the Service is also governed by our{" "}
              <Link
                href="/privacy-policy"
                className="text-[#ededed] underline underline-offset-4 transition-colors duration-300 hover:text-white"
              >
                Privacy Policy
              </Link>
              , which describes what data we collect, how we use it, and how you
              can manage your information.
            </p>
          </Section>

          <Section title="Intellectual property">
            <p>
              All content, branding, and technology comprising the Ventzon
              platform are owned by Ventzon. You may not copy, modify,
              distribute, or reverse-engineer any part of the Service without
              prior written consent.
            </p>
          </Section>

          <Section title="Disclaimers">
            <p>
              The Service is provided &ldquo;as is&rdquo; and &ldquo;as
              available&rdquo; without warranties of any kind, whether express
              or implied. We do not guarantee uninterrupted service, push
              notification delivery, or the accuracy of visit tracking. Ventzon is not
              responsible for the content of promotional messages sent by
              merchants.
            </p>
          </Section>

          <Section title="Limitation of liability">
            <p>
              To the fullest extent permitted by law, Ventzon shall not be
              liable for any indirect, incidental, special, consequential, or
              punitive damages arising from your use of the Service. Our total
              liability shall not exceed the amount you paid to Ventzon in the
              12 months preceding the claim.
            </p>
          </Section>

          <Section title="Changes to these terms">
            <p>
              We may update these terms from time to time. Material changes will
              be posted on this page with an updated effective date. Continued
              use of the Service after changes constitutes acceptance of the
              revised terms.
            </p>
          </Section>

          <Section title="Contact">
            <p>
              Questions about these terms? Reach us at{" "}
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

        {/* Back link */}
        <div className="mt-14 border-t border-[#1a1a1a] pt-8">
          <Link
            href="/"
            className="text-[12px] font-light tracking-[0.1em] text-[#444] transition-colors duration-300 hover:text-[#ededed]"
          >
            &larr; Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
