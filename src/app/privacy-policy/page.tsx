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
    <section className="rounded-2xl border border-night-700 p-8 transition-colors duration-500 hover:border-[#222]">
      <h2 className="text-[15px] font-normal tracking-[-0.01em] text-fog-100">
        {title}
      </h2>
      <div className="mt-4 space-y-3 text-[14px] font-light leading-[1.8] text-fog-500">
        {children}
      </div>
    </section>
  );
}

export default function PrivacyPolicyPage() {
  return (
    <main className="marketing min-h-screen bg-night-950 px-6 pb-20 pt-28 text-fog-100">
      <div className="mx-auto w-full max-w-3xl">
        <p className="text-[11px] font-light tracking-[0.3em] text-fog-500">
          LEGAL
        </p>
        <h1 className="mt-4 text-4xl font-light tracking-[0.02em] text-fog-100 sm:text-5xl">
          Privacy Policy
        </h1>
        <p className="mt-4 text-[14px] font-light text-fog-500">
          Effective date: September 12, 2026
        </p>

        <div className="mt-12 space-y-6">
          <Section title="Who we are">
            <p>
              Ventzon (&ldquo;we,&rdquo; &ldquo;us,&rdquo; &ldquo;our&rdquo;)
              operates a customer loyalty rewards platform that helps local
              businesses run loyalty programs. This includes our mobile apps and
              web-based check-in experience. This policy explains what data we
              collect, why we collect it, and how we protect it.
            </p>
          </Section>

          <Section title="Data we collect">
            <p>We collect the minimum data needed to operate the service:</p>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <span className="font-normal text-fog-100">
                  Email address
                </span>{" "}
                — collected when you create an account or sign in via the iOS
                app or web platform. Used to identify your loyalty account and
                send account-related notifications.
              </li>
              <li>
                <span className="font-normal text-fog-100">
                  Name
                </span>{" "}
                — optionally provided when signing in with Google. Used to
                personalize your experience.
              </li>
              <li>
                <span className="font-normal text-fog-100">
                  Date of birth
                </span>{" "}
                — collected when you create an account, only to confirm you&rsquo;re
                13 or older. Used for the age gate and nothing else.
              </li>
              <li>
                <span className="font-normal text-fog-100">
                  Visit history
                </span>{" "}
                — the number of check-ins per shop and the date of each visit.
                Used to track progress toward rewards.
              </li>
              <li>
                <span className="font-normal text-fog-100">Phone number</span>{" "}
                — optionally provided when checking in at a participating shop
                via QR code. Used to identify you across visits.
              </li>
              <li>
                <span className="font-normal text-fog-100">6-digit PIN</span>{" "}
                — an optional PIN you set for quick re-check-ins on the web
                platform. Stored as a one-way hash (scrypt); we cannot read
                your PIN.
              </li>
              <li>
                <span className="font-normal text-fog-100">Location</span>{" "}
                — with your permission, your device&rsquo;s approximate and
                precise coordinates are sent to our servers to work out how far
                away nearby places are and to center the map. They are used to
                answer that request and are not stored in our database. You can
                decline location and still browse.
              </li>
              <li>
                <span className="font-normal text-fog-100">
                  Push notification token
                </span>{" "}
                — if you allow notifications, we store the device token your
                platform issues (APNs on iOS, FCM on Android) so we can deliver
                them. It is linked to your account and shared with our push
                provider, OneSignal. You can turn notifications off at any time.
              </li>
              <li>
                <span className="font-normal text-fog-100">
                  Content you post
                </span>{" "}
                — the posts, photos, videos, and comments you create, plus the
                likes, saves, and follows you make. Posts you publish are public
                to other Ventzon users.
              </li>
            </ul>
            <p>
              We do not collect or store your payment card details. Merchant
              subscription payments are handled entirely by Stripe.
            </p>
          </Section>

          <Section title="How you opt in">
            <p>
              You may create a Ventzon account with your email address and a
              password, or by signing in with Google or Apple via the app or
              website. You may also check in at a participating shop by
              scanning a QR code and entering your phone number.
            </p>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <span className="font-normal text-fog-100">
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
                className="text-fog-100 underline underline-offset-4 transition-colors duration-300 hover:text-white"
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

          <Section title="Aggregated insights for merchants">
            <p>
              A merchant sees summary figures for{" "}
              <span className="font-normal text-fog-100">their own shop only</span>{" "}
              — how many check-ins happened this week versus last, which day of
              the week is quietest, and how many customers have not been back in
              a while. These are counts and trends; a merchant cannot identify
              you from them.
            </p>
            <p>
              When we generate a written insight or promotional copy for a
              merchant, those summary figures and the shop&rsquo;s own name are
              sent to our AI provider, Anthropic. No customer names, email
              addresses, or phone numbers are included.
            </p>
            <p>
              We do not sell or license your personal data, and we do not
              include it in anything a merchant sees.
            </p>
          </Section>

          <Section title="Third-party services">
            <p>
              We use the following processors to operate the platform. Each
              receives only what it needs to do its job, and none of them may
              use your data for their own marketing.
            </p>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <span className="font-normal text-fog-100">Supabase</span> —
                account authentication, database, and file storage. Data is
                encrypted at rest and in transit.
              </li>
              <li>
                <span className="font-normal text-fog-100">Sentry</span> —
                crash reporting and performance monitoring. Receives error
                details and the state of the page when an error happens, so we
                can diagnose it.
              </li>
              <li>
                <span className="font-normal text-fog-100">OneSignal</span> —
                push notification delivery. Receives your device token and the
                notification contents, solely to deliver them.
              </li>
              <li>
                <span className="font-normal text-fog-100">Resend</span> —
                transactional email. Receives the recipient address and the
                message we send.
              </li>
              <li>
                <span className="font-normal text-fog-100">Google</span> —
                for optional Sign in with Google authentication. If you choose
                it, your name and email address are shared with us by Google in
                accordance with{" "}
                <a
                  href="https://policies.google.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-fog-100 underline underline-offset-4 transition-colors duration-300 hover:text-white"
                >
                  Google&rsquo;s Privacy Policy
                </a>
                .
              </li>
              <li>
                <span className="font-normal text-fog-100">Apple</span> — for
                optional Sign in with Apple. If you choose it, Apple shares an
                account identifier and, on your first sign-in, your name and
                email address.
              </li>
              <li>
                <span className="font-normal text-fog-100">Stripe</span> —
                for processing merchant subscription payments. Ventzon does not
                handle or store merchant payment card data.
              </li>
              <li>
                <span className="font-normal text-fog-100">Anthropic</span> —
                generates merchant insights and promotional copy from the
                summary shop figures described above. No customer names, email
                addresses, or phone numbers are sent.
              </li>
              <li>
                <span className="font-normal text-fog-100">CARTO</span> and{" "}
                <span className="font-normal text-fog-100">OpenStreetMap</span>{" "}
                — map tiles and address lookup. These requests carry your IP
                address and the map area you are viewing, along with merchant
                addresses we look up.
              </li>
              <li>
                <span className="font-normal text-fog-100">Upstash</span> —
                rate limiting. Receives your IP address and the route being
                called, so we can block abuse.
              </li>
              <li>
                <span className="font-normal text-fog-100">Vercel</span> —
                hosting and delivery. Receives standard request information
                (including your IP address) as our infrastructure provider.
              </li>
            </ul>
          </Section>

          <Section title="Data retention">
            <p>
              We retain your account data for as long as your account is
              active. When you delete your account from Settings, we remove your
              profile, posts, photos, comments, likes, and follows, and delete
              your stored media.
            </p>
            <p>
              Email and push delivery logs are kept for up to 90 days for
              troubleshooting. Our hosting provider keeps standard server
              request logs, which can include the coordinates in a nearby or map
              request, for the period needed to run and secure the service.
            </p>
          </Section>

          <Section title="Children's privacy">
            <p>
              Ventzon is not directed to children under the age of 13. We do
              not knowingly collect personal information from children under 13.
              We ask for your date of birth when you create an account to
              confirm you&rsquo;re old enough to use Ventzon; if you tell us you&rsquo;re
              under 13, we record only that the request was refused and do not
              keep the date you entered. If you believe a child has provided us
              personal information, please contact us and we will delete it
              promptly.
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
                className="text-fog-100 underline underline-offset-4 transition-colors duration-300 hover:text-white"
              >
                support@ventzon.com
              </a>
              .
            </p>
          </Section>
        </div>

        {/* Footer links */}
        <div className="mt-14 flex items-center justify-between border-t border-night-700 pt-8">
          <Link
            href="/"
            className="text-[12px] font-light tracking-[0.1em] text-fog-600 transition-colors duration-300 hover:text-fog-100"
          >
            &larr; Back to home
          </Link>
          <Link
            href="/terms"
            className="text-[12px] font-light tracking-[0.1em] text-fog-600 transition-colors duration-300 hover:text-fog-100"
          >
            Terms of Service
          </Link>
        </div>
      </div>
    </main>
  );
}
