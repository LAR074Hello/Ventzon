import { redirect } from "next/navigation";

export default async function JoinIndexPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const raw = sp.shop_slug ?? sp.shop;

  const shopSlug = Array.isArray(raw) ? raw[0] : raw;
  const cleaned = String(shopSlug ?? "").trim().toLowerCase();

  if (cleaned) redirect(`/join/${encodeURIComponent(cleaned)}`);

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100">
      <div className="mx-auto max-w-xl px-6 py-16">
        <div className="text-xs tracking-[0.35em] text-neutral-400">
          VENTZON REWARDS
        </div>
        <h1 className="mt-3 text-3xl font-semibold">Missing shop</h1>
        <p className="mt-3 text-neutral-300">
          Open a link like <span className="font-mono">/join/govans-groceries</span>{" "}
          (or <span className="font-mono">/join?shop_slug=govans-groceries</span>)
        </p>
      </div>
    </main>
  );
}