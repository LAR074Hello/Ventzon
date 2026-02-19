export const metadata = {
  title: "Terms of Service | Ventzon",
  description: "Terms and conditions for using the Ventzon rewards platform.",
};

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur">
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      <div className="mt-4 space-y-3 text-sm leading-relaxed text-white/70">
        {children}
      </div>
    </section>
  );
}

export default function TermsPage() {
  return (
    <main className="min-h-[calc(100vh-72px)] px-6 py-16 text-white">
      <div className="mx-auto w-full max-w-3xl">
        <div className="text-xs uppercase tracking-[0.28em] text-white/60">
          Legal
        </div>
        <h1 className="mt-3 text-4xl font-semibold leading-tight">
          Terms of Service
        </h1>
        <p className="mt-4 text-white/70">
          Effective date: February 18, 2026
        </p>

        <div className="mt-10 space-y-6">
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
              Ventzon is an SMS-based loyalty and rewards platform. Merchants
              create reward programs tied to a QR code. Customers scan the code,
              provide a phone number, and receive SMS messages tracking their
              visit progress and reward eligibility. Merchants may also send
              promotional SMS messages to opted-in customers.
            </p>
          </Section>

          <Section title="Customer SMS terms">
            <p>
              By checking in at a participating shop (scanning the QR code and
              entering your phone number), you consent to receive SMS messages
              from Ventzon on behalf of that shop. These messages include:
            </p>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <span className="font-medium text-white">
                  Transactional messages
                </span>{" "}
                — check-in confirmations, visit progress updates, and reward
                redemption notifications.
              </li>
              <li>
                <span className="font-medium text-white">
                  Promotional messages
                </span>{" "}
                — marketing texts sent by the merchant such as deals, events, or
                announcements.
              </li>
            </ul>
            <p>
              Message frequency varies. Message and data rates may apply. You
              can opt out at any time by replying{" "}
              <span className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-white">
                STOP
              </span>{" "}
              to any Ventzon message. Reply{" "}
              <span className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-white">
                HELP
              </span>{" "}
              for assistance.
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
                Comply with all applicable laws and regulations including the
                Telephone Consumer Protection Act (TCPA) and CAN-SPAM Act.
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
              <a
                href="/privacy-policy"
                className="text-white underline underline-offset-2 hover:text-white/90"
              >
                Privacy Policy
              </a>
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
              or implied. We do not guarantee uninterrupted service, SMS
              delivery, or the accuracy of visit tracking. Ventzon is not
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
                className="text-white underline underline-offset-2 hover:text-white/90"
              >
                support@ventzon.com
              </a>
              .
            </p>
          </Section>
        </div>
      </div>
    </main>
  );
}
