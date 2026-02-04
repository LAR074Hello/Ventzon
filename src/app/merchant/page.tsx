export default function MerchantIndex() {
  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100">
      <div className="mx-auto w-full max-w-3xl px-6 py-12">
        <div className="text-xs uppercase tracking-widest text-neutral-500">
          Ventzon Rewards
        </div>
        <h1 className="mt-2 text-3xl font-semibold">Merchant Dashboard</h1>
        <p className="mt-3 text-sm text-neutral-400">
          This is the merchant view for your rewards program. You’ll open your
          shop page to see today’s signups and your join link.
        </p>

        <section className="mt-8 rounded-2xl border border-neutral-800 bg-neutral-950/40 p-6">
          <div className="text-sm font-medium text-neutral-200">
            Open your shop dashboard
          </div>
          <div className="mt-2 text-sm text-neutral-400">
            Example:
          </div>
          <div className="mt-3 rounded-xl border border-neutral-800 bg-neutral-950 p-3 font-mono text-xs text-neutral-200">
            /merchant/govans-groceries
          </div>

          <div className="mt-4 text-xs text-neutral-500">
            If you don’t know your shop slug yet, it’s usually the shop name in
            lowercase with hyphens.
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-neutral-800 bg-neutral-950/40 p-6">
          <div className="text-sm font-medium text-neutral-200">How it works</div>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-neutral-400">
            <li>Customers join with their phone number on your join page.</li>
            <li>We store signups in Supabase and prevent multiple per day.</li>
            <li>You can view totals + today + latest signups on your dashboard.</li>
          </ul>
        </section>
      </div>
    </main>
  );
}