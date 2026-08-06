"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="marketing flex min-h-screen items-center justify-center bg-night-950 px-6 pt-24 pb-12">
      <div className="w-full max-w-md text-center animate-fade-in opacity-0 anim-delay-200">
        <p className="font-mono text-[64px] font-light text-[#1a1a1a]">
          500
        </p>
        <h1 className="mt-2 text-2xl font-light tracking-[0.02em] text-fog-100">
          Something went wrong
        </h1>
        <p className="mt-3 text-[14px] font-light leading-relaxed text-fog-500">
          An unexpected error occurred. Please try again.
        </p>
        <div className="mt-10 flex justify-center gap-4">
          <button
            onClick={reset}
            className="rounded-full border border-fog-100 px-6 py-2.5 text-[12px] font-light tracking-[0.15em] text-fog-100 transition-all duration-500 hover:bg-fog-100 hover:text-black"
          >
            Try again
          </button>
          <a
            href="/"
            className="rounded-full border border-night-600 px-6 py-2.5 text-[12px] font-light tracking-[0.15em] text-fog-100 transition-all duration-500 hover:border-[#666] hover:bg-white/5"
          >
            Go home
          </a>
        </div>
      </div>
    </main>
  );
}
