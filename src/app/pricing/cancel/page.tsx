export default function Page() {
  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center p-8">
      <div className="max-w-md w-full rounded-2xl border border-neutral-800 bg-neutral-950 p-6">
        <h1 className="text-xl font-semibold">Subscription canceled</h1>
        <p className="mt-2 text-sm text-neutral-300">
          Your subscription has been canceled. If this was a mistake, you can subscribe again anytime.
        </p>
        <a
          href="/pricing"
          className="mt-6 inline-flex items-center justify-center rounded-xl bg-white px-4 py-2 text-sm font-medium text-black"
        >
          Back to pricing
        </a>
      </div>
    </main>
  );
}