import Link from "next/link";

export default function PricingCancelPage() {
  return (
    <main className="marketing flex min-h-screen items-center justify-center bg-night-950 px-8 text-fog-100">
      <div className="w-full max-w-md text-center">
        <p className="text-[11px] font-light tracking-[0.5em] text-fog-500">
          CANCELED
        </p>
        <h1 className="mt-6 text-3xl font-light tracking-[0.02em] sm:text-4xl">
          Subscription canceled.
        </h1>
        <p className="mt-5 text-[15px] font-light leading-[1.8] text-fog-500">
          If this was a mistake, you can subscribe again anytime.
          No data has been deleted.
        </p>
        <Link
          href="/pricing"
          className="mt-10 inline-flex items-center gap-2 rounded-full border border-night-600 px-8 py-3.5 text-[12px] font-light tracking-[0.15em] text-fog-100 transition-all duration-500 hover:border-[#666] hover:bg-white/5"
        >
          Back to pricing
        </Link>
      </div>
    </main>
  );
}
