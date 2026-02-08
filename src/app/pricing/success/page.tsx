

export default function Page() {
  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center p-8">
      <div className="max-w-md w-full rounded-2xl border border-neutral-800 bg-neutral-950 p-6">
        <h1 className="text-xl font-semibold">Subscription active</h1>
        <p className="mt-2 text-sm text-neutral-300">
          Thanks — you’re all set. Your subscription is active. You can close this page or go back to the merchant dashboard.
        </p>
        <div className="mt-6 flex gap-3">
          <a
            href="/merchant"
            className="inline-flex items-center justify-center rounded-xl bg-white px-4 py-2 text-sm font-medium text-black"
          >
            Go to merchant
          </a>
          <a
            href="/pricing"
            className="inline-flex items-center justify-center rounded-xl border border-neutral-700 bg-transparent px-4 py-2 text-sm font-medium text-white"
          >
            Back to pricing
          </a>
        </div>
      </div>
    </main>
  );
}