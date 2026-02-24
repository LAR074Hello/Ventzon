import Link from "next/link";

export default function PricingCancelPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-8 text-[#ededed]">
      <div className="w-full max-w-md text-center">
        <p className="text-[11px] font-light tracking-[0.5em] text-[#666]">
          CANCELED
        </p>
        <h1 className="mt-6 text-3xl font-extralight tracking-[-0.02em] sm:text-4xl">
          Subscription canceled.
        </h1>
        <p className="mt-5 text-[15px] font-light leading-[1.8] text-[#666]">
          If this was a mistake, you can subscribe again anytime.
          No data has been deleted.
        </p>
        <Link
          href="/pricing"
          className="mt-10 inline-flex items-center gap-2 rounded-full border border-[#333] px-8 py-3.5 text-[12px] font-light tracking-[0.15em] text-[#ededed] transition-all duration-500 hover:border-[#666] hover:bg-white/5"
        >
          Back to pricing
        </Link>
      </div>
    </main>
  );
}
