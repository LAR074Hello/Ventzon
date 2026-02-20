"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-[calc(100vh-72px)] items-center justify-center bg-neutral-950 px-6 text-white">
      <div className="text-center">
        <div className="text-6xl font-semibold text-neutral-700">500</div>
        <h1 className="mt-4 text-2xl font-semibold">Something went wrong</h1>
        <p className="mt-2 text-neutral-400">
          An unexpected error occurred. Please try again.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <button
            onClick={reset}
            className="rounded-xl bg-white px-5 py-2.5 text-sm font-medium text-black hover:bg-neutral-200"
          >
            Try again
          </button>
          <a
            href="/"
            className="rounded-xl border border-neutral-700 px-5 py-2.5 text-sm font-medium text-neutral-200 hover:bg-neutral-900"
          >
            Go home
          </a>
        </div>
      </div>
    </main>
  );
}
