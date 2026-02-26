"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-6 pt-24 pb-12">
      <div className="w-full max-w-md text-center animate-fade-in opacity-0 anim-delay-200">
        <p className="font-mono text-[64px] font-extralight text-[#1a1a1a]">
          500
        </p>
        <h1 className="mt-2 text-2xl font-extralight tracking-[-0.02em] text-[#ededed]">
          Something went wrong
        </h1>
        <p className="mt-3 text-[14px] font-light leading-relaxed text-[#555]">
          An unexpected error occurred. Please try again.
        </p>
        <div className="mt-10 flex justify-center gap-4">
          <button
            onClick={reset}
            className="rounded-full border border-[#ededed] px-6 py-2.5 text-[12px] font-light tracking-[0.15em] text-[#ededed] transition-all duration-500 hover:bg-[#ededed] hover:text-black"
          >
            Try again
          </button>
          <a
            href="/"
            className="rounded-full border border-[#333] px-6 py-2.5 text-[12px] font-light tracking-[0.15em] text-[#ededed] transition-all duration-500 hover:border-[#666] hover:bg-white/5"
          >
            Go home
          </a>
        </div>
      </div>
    </main>
  );
}
