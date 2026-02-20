import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-[calc(100vh-72px)] items-center justify-center bg-neutral-950 px-6 text-white">
      <div className="text-center">
        <div className="text-6xl font-semibold text-neutral-700">404</div>
        <h1 className="mt-4 text-2xl font-semibold">Page not found</h1>
        <p className="mt-2 text-neutral-400">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link
            href="/"
            className="rounded-xl bg-white px-5 py-2.5 text-sm font-medium text-black hover:bg-neutral-200"
          >
            Go home
          </Link>
          <Link
            href="/merchant/dashboard"
            className="rounded-xl border border-neutral-700 px-5 py-2.5 text-sm font-medium text-neutral-200 hover:bg-neutral-900"
          >
            Merchant dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
