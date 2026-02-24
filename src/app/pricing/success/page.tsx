import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function PricingSuccessPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-8 text-[#ededed]">
      <div className="w-full max-w-md text-center">
        <p className="text-[11px] font-light tracking-[0.5em] text-[#666]">
          CONFIRMED
        </p>
        <h1 className="mt-6 text-3xl font-extralight tracking-[-0.02em] sm:text-4xl">
          You&rsquo;re all set.
        </h1>
        <p className="mt-5 text-[15px] font-light leading-[1.8] text-[#666]">
          Your subscription is active. Head to your dashboard to start managing
          your shop.
        </p>
        <Link
          href="/merchant/dashboard"
          className="mt-10 inline-flex items-center gap-3 rounded-full border border-[#ededed] px-8 py-3.5 text-[12px] font-light tracking-[0.15em] text-[#ededed] transition-all duration-500 hover:bg-[#ededed] hover:text-black"
        >
          Go to dashboard
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </main>
  );
}
