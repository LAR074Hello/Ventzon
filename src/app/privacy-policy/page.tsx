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
          Effective date: April 28, 2026
        </p>

        <div className="mt-12 space-y-6">
          <Section title="Who we are">
            <p>
              Ventzon (&ldquo;we,&rdquo; &ldquo;us,&rdquo; &ldquo;our&rdquo;)
              operates a customer loyalty rewards platform that helps local
              businesses run loyalty programs. This includes our iOS app and
              web-based check-in experience. This policy explains what data we
              collect, why we collect it, and how we protect it.
            </p>
          </Section>

          <Section title="Data we collect">
            <p>We collect the minimum data needed to operate the service:</p>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <span className="font-normal text-[#ededed]">
                  Email address
                </span>{" "}
                — collected when you create an account or sign in via the iOS
                app or web platform. Used to identify your loyalty account and
                send account-related notifications.
              </li>
              <li>
                <span className="font-normal text-[#ededed]">
                  Name
                </span>{" "}
                — optionally provided when signing in with Google. Used to
                personalize your experience.
              </li>
              <li>
                <span className="font-normal text-[#ededed]">
                  Visit history
                </span>{" "}
                — the number of check-ins per shop and the date of each visit.
                Used to track progress toward rewards.
              </li>
              <li>
                <span className="font-normal text-[#ededed]">Phone number</span>{" "}
                — optionally provided when checking in at a participating shop
                via QR code. Used to identify you across visits.
              </li>
              <li>
                <span className="font-normal text-[#ededed]">6-digit PIN</span>{" "}
                — an optional PIN you set for quick re-check-ins on the web
                platform. Stored as a one-way hash (scrypt); we cannot read
                your PIN.
              </li>
            </ul>
            <p>
              We do not collect payment information, precise location data, or
              device identifiers from customers.
            </p>
          </Section>

          <Section title="How you opt in">
            <p>
              You may create a Ventzon account by registering with your email
              address or by signing in with Google via the iOS app or website.
              You may also check in at a participating shop by scanning a QR
              code and entering your phone number.
            </p>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <span className="font-normal text-[#ededed]">
                  Push notifications
                </span>{" "}
                — reward milestones and earned rewards delivered via push
                notification (app) or email.
              </li>
            </ul>
          </Section>

          <Section title="How to opt out">
            <p>
              You may delete your account at any time by contacting us at{" "}
              <a
                href="mailto:support@ventzon.com"
                className="text-[#ededed] underline underline-offset-4 transition-colors duration-300 hover:text-white"
              >
                support@ventzon.com
              </a>
              . Upon request, we will delete your account and associated data
              within 30 days.
            </p>
            <p>
              You can disable push notifications at any time in your
              device&rsquo;s Settings under Notifications. To unsubscribe from
              email notifications, use the unsubscribe link in any email or
              contact us.
            </p>
          </Section>

          <Section title="How we use your data">
            <ul className="list-disc space-y-2 pl-5">
              <li>Authenticating your account and enabling app sign-in.</li>
              <li>
                Tracking visit progress toward each shop&rsquo;s reward goal.
              </li>
              <li>
                Delivering check-in confirmations and reward notifications.
              </li>
              <li>
                Enabling merchants to send promotional messages to opted-in
                customers.
              </li>
              <li>
                Maintaining logs for delivery tracking and troubleshooting.
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
                <span className="font-normal text-[#ededed]">Google</span> —
                for optional Sign in with Google authentication. If you choose
                to sign in with Google, your name and email address are shared
                with us by Google in accordance with{" "}
                <a
                  href="https://policies.google.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#ededed] underline underline-offset-4 transition-colors duration-300 hover:text-white"
                >
                  Google&rsquo;s Privacy Policy
                </a>
                .
              </li>
              <li>
                <span className="font-normal text-[#ededed]">Supabase</span> —
                for secure account and data storage. Data is encrypted at rest
                and in transit.
              </li>
              <li>
                <span className="font-normal text-[#ededed]">OneSignal</span> —
                for delivering push notifications to the Ventzon app.
                Device tokens are shared with OneSignal solely for
                notification delivery.
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
              We retain your account data for as long as your account is
              active. If you request account deletion, we will remove your data
              within 30 days. Message logs may be retained for up to 90 days
              for delivery troubleshooting.
            </p>
          </Section>

          <Section title="Children's privacy">
            <p>
              Ventzon is not directed to children under the age of 13. We do
              not knowingly collect personal information from children under 13.
              If you believe a child has provided us personal information,
              please contact us and we will delete it promptly.
            </p>
          </Section>

          <Section title="Security">
            <p>
              We protect your data with industry-standard measures including
              encrypted connections (TLS), hashed PINs (scrypt), and
              access-controlled databases. No system is perfectly secure, but
              we take reasonable steps to safeguard your information.
            </p>
          </Section>

          <Section title="Changes to this policy">
            <p>
              We may update this policy from time to time. Material changes
              will be posted on this page with an updated effective date.
              Continued use of the service after changes constitutes acceptance
              of the revised policy.
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
