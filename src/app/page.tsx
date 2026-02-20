import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      {/* Hero */}
      <section className="relative overflow-hidden px-6 py-24 sm:py-32">
        {/* Background glow */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-[-120px] h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-neutral-800/40 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-4xl text-center">
          <div className="text-xs tracking-[0.35em] text-neutral-400">
            VENTZON REWARDS
          </div>

          <h1 className="mt-6 text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">
            Turn one-time buyers into
            <br className="hidden sm:block" />{" "}
            <span className="text-white">loyal regulars.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-neutral-300">
            A simple SMS rewards program for local businesses. Customers scan a
            QR code, check in, and earn rewards — no app download needed.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/signup"
              className="rounded-xl bg-white px-6 py-3 text-sm font-semibold text-black hover:bg-neutral-200"
            >
              Get started free
            </Link>
            <Link
              href="/how-it-works"
              className="rounded-xl border border-neutral-700 px-6 py-3 text-sm font-medium text-neutral-200 hover:border-neutral-500 hover:bg-neutral-900"
            >
              See how it works
            </Link>
          </div>
        </div>
      </section>

      {/* How it works (brief) */}
      <section className="border-t border-neutral-800 px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <div className="text-xs tracking-[0.35em] text-neutral-400">
              HOW IT WORKS
            </div>
            <h2 className="mt-3 text-3xl font-semibold">
              Three steps to more repeat customers
            </h2>
          </div>

          <div className="mt-12 grid gap-8 md:grid-cols-3">
            <div className="rounded-2xl border border-neutral-800 bg-neutral-950/40 p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-700 bg-neutral-900 text-sm font-semibold">
                1
              </div>
              <h3 className="mt-4 text-lg font-medium">Print your QR code</h3>
              <p className="mt-2 text-sm text-neutral-400">
                Place it near your register. Customers scan with their phone
                camera — no app needed.
              </p>
            </div>

            <div className="rounded-2xl border border-neutral-800 bg-neutral-950/40 p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-700 bg-neutral-900 text-sm font-semibold">
                2
              </div>
              <h3 className="mt-4 text-lg font-medium">Customers check in</h3>
              <p className="mt-2 text-sm text-neutral-400">
                They enter their phone number and a PIN. One check-in per day
                keeps it fair and simple.
              </p>
            </div>

            <div className="rounded-2xl border border-neutral-800 bg-neutral-950/40 p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-700 bg-neutral-900 text-sm font-semibold">
                3
              </div>
              <h3 className="mt-4 text-lg font-medium">They earn rewards</h3>
              <p className="mt-2 text-sm text-neutral-400">
                After enough visits, they get an SMS with their reward. You set
                the goal and the offer.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Ventzon */}
      <section className="border-t border-neutral-800 px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <h2 className="text-3xl font-semibold">
              Why local businesses choose Ventzon
            </h2>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                title: "No app download",
                desc: "Works with any phone camera and SMS. Zero friction for customers.",
              },
              {
                title: "Ready in 5 minutes",
                desc: "Sign up, name your shop, set your reward, print the QR. Done.",
              },
              {
                title: "You own the list",
                desc: "SMS goes direct to customers — no algorithm, no middleman.",
              },
              {
                title: "Simple pricing",
                desc: "$49.99/month. No hidden fees, no per-message charges, cancel anytime.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-neutral-800 bg-neutral-950/40 p-5"
              >
                <div className="text-sm font-semibold">{item.title}</div>
                <p className="mt-2 text-sm text-neutral-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social proof / trust */}
      <section className="border-t border-neutral-800 px-6 py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-semibold">
            Built for the businesses that know their customers by name
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-neutral-400">
            Coffee shops, barbershops, salons, restaurants, bakeries, gyms —
            anywhere repeat visits matter. Ventzon gives you a direct line to
            your best customers.
          </p>
        </div>
      </section>

      {/* Pricing preview */}
      <section className="border-t border-neutral-800 px-6 py-20">
        <div className="mx-auto max-w-3xl">
          <div className="text-center">
            <div className="text-xs tracking-[0.35em] text-neutral-400">
              PRICING
            </div>
            <h2 className="mt-3 text-3xl font-semibold">
              One plan, everything included
            </h2>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            <div className="rounded-2xl border border-neutral-800 bg-neutral-950/40 p-6">
              <div className="text-lg font-medium">Monthly</div>
              <div className="mt-1 text-3xl font-semibold">
                $49.99<span className="text-lg font-normal text-neutral-400">/mo</span>
              </div>
              <ul className="mt-4 space-y-2 text-sm text-neutral-400">
                <li>QR code + join page</li>
                <li>Unlimited customer check-ins</li>
                <li>Custom rewards & SMS</li>
                <li>Merchant dashboard</li>
                <li>Cancel anytime</li>
              </ul>
              <Link
                href="/signup"
                className="mt-6 block rounded-xl bg-white py-2.5 text-center text-sm font-semibold text-black hover:bg-neutral-200"
              >
                Get started
              </Link>
            </div>

            <div className="rounded-2xl border border-neutral-800 bg-neutral-950/40 p-6">
              <div className="text-lg font-medium">Yearly</div>
              <div className="mt-1 text-3xl font-semibold">
                $479.99<span className="text-lg font-normal text-neutral-400">/yr</span>
              </div>
              <div className="mt-1 text-sm text-emerald-400">Save $120/year</div>
              <ul className="mt-4 space-y-2 text-sm text-neutral-400">
                <li>Everything in Monthly</li>
                <li>2 months free</li>
                <li>Priority support</li>
              </ul>
              <Link
                href="/signup"
                className="mt-6 block rounded-xl border border-neutral-700 py-2.5 text-center text-sm font-medium text-neutral-200 hover:bg-neutral-900"
              >
                Get started
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-neutral-800 px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold">
            Ready to build loyalty that lasts?
          </h2>
          <p className="mt-4 text-neutral-400">
            Set up your rewards program in under 5 minutes.
          </p>
          <Link
            href="/signup"
            className="mt-8 inline-block rounded-xl bg-white px-8 py-3 text-sm font-semibold text-black hover:bg-neutral-200"
          >
            Create your free account
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-800 px-6 py-10">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="text-xs tracking-[0.25em] text-neutral-500">
            VENTZON
          </div>
          <div className="flex gap-6 text-sm text-neutral-500">
            <Link href="/how-it-works" className="hover:text-neutral-300">
              How it works
            </Link>
            <Link href="/pricing" className="hover:text-neutral-300">
              Pricing
            </Link>
            <Link href="/privacy" className="hover:text-neutral-300">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-neutral-300">
              Terms
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
