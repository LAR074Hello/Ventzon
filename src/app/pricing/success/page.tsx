import Link from "next/link";

export default function PricingSuccessPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-black p-8 text-white">
      <div className="w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-950 p-6">
        <h1 className="text-xl font-semibold">You're all set!</h1>
        <p className="mt-2 text-sm text-neutral-300">
          Your subscription is active. Head to your dashboard to start
          managing your shop.
        </p>
        <Link
          href="/merchant/dashboard"
          className="mt-6 inline-flex items-center justify-center rounded-xl bg-white px-4 py-2 text-sm font-medium text-black"
        >
          Go to dashboard
        </Link>
      </div>
    </main>
  );
}
