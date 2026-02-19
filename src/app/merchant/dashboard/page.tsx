import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export default async function MerchantDashboardPage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Find shops owned by this user
  const { data: shopRows, error } = await supabase
    .from("shops")
    .select("id, slug, is_paid, subscription_status")
    .eq("user_id", user.id);

  if (error) {
    console.error("Failed to load shops:", error);
    return (
      <main className="mx-auto max-w-3xl px-6 py-12 text-white">
        <h1 className="text-2xl font-semibold">Something went wrong</h1>
        <p className="mt-2 text-sm text-neutral-400">
          Could not load your shops. Please try again later.
        </p>
      </main>
    );
  }

  const shops = (shopRows ?? []).filter(
    (s: any) => s && typeof s.slug === "string" && s.slug.length > 0
  );

  // No shops — send to create
  if (shops.length === 0) {
    redirect("/merchant/create");
  }

  // Single shop — redirect straight to the shop dashboard
  if (shops.length === 1) {
    redirect(`/merchant/${shops[0].slug}`);
  }

  // Multiple shops — show selector with shop info
  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100">
      <div className="mx-auto max-w-3xl px-6 py-12">
        <div className="text-xs tracking-[0.35em] text-neutral-400">
          VENTZON REWARDS
        </div>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          Merchant Dashboard
        </h1>
        <p className="mt-2 text-sm text-neutral-400">
          Your account has access to multiple shops. Pick one to open its
          dashboard.
        </p>

        <div className="mt-6 grid gap-3">
          {shops.map((shop: any) => (
            <Link
              key={shop.id ?? shop.slug}
              href={`/merchant/${shop.slug}`}
              className="rounded-2xl border border-neutral-800 bg-neutral-950/60 px-5 py-4 transition hover:-translate-y-0.5 hover:border-neutral-700"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="text-lg font-medium text-white">
                  {shop.slug}
                </div>
                <span
                  className={`rounded-full border px-3 py-1 text-xs ${
                    shop.is_paid
                      ? "border-emerald-700/60 bg-emerald-950/30 text-emerald-200"
                      : "border-neutral-800 bg-neutral-950/40 text-neutral-400"
                  }`}
                >
                  {shop.is_paid ? "Active" : "Inactive"}
                </span>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-8">
          <Link
            href="/merchant/create"
            className="inline-flex items-center rounded-xl bg-white px-4 py-2 text-sm font-medium text-black hover:bg-neutral-200"
          >
            Create another shop
          </Link>
        </div>
      </div>
    </main>
  );
}
