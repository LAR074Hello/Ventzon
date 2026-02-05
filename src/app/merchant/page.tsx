import { redirect } from "next/navigation";

export default function MerchantIndexPage({
  searchParams,
}: {
  searchParams?: { shop_slug?: string };
}) {
  const shopSlug = String(searchParams?.shop_slug ?? "").trim().toLowerCase();

  // If someone visits /merchant?shop_slug=govans-groceries -> send to /merchant/govans-groceries
  if (shopSlug) {
    redirect(`/merchant/${shopSlug}`);
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <div className="tracking-[0.2em] text-xs text-neutral-400">VENTZON REWARDS</div>
        <h1 className="mt-4 text-4xl font-semibold">Merchant Dashboard</h1>
        <p className="mt-2 text-neutral-300">
          This is the merchant view for your rewards program. You’ll open your shop page to see today’s signups and your join link.
        </p>

        <div className="mt-10 rounded-2xl border border-neutral-800 bg-neutral-950/40 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.03)]">
          <div className="text-sm text-neutral-200">Open your shop dashboard</div>
          <div className="mt-2 text-xs text-neutral-400">Example:</div>
          <div className="mt-2 rounded-xl border border-neutral-800 bg-black px-4 py-3 font-mono text-sm text-neutral-200">
            /merchant/govans-groceries
          </div>
          <div className="mt-3 text-xs text-neutral-500">
            If you don’t know your shop slug yet, it’s usually the shop name in lowercase with hyphens.
          </div>
        </div>
      </div>
    </main>
  );
}