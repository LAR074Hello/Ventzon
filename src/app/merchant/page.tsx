import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export default async function MerchantIndexPage() {
  // NOTE: this can be async depending on your cookie bridge implementation
  const supabase = await createSupabaseServerClient();

  // 1) Must be logged in
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 2) Find shops owned by this user
  const { data: shopRows, error } = await supabase
    .from("shops")
    .select("id, slug")
    .eq("user_id", user.id);

  if (error) {
    console.error("Failed to load shops:", error);
    redirect("/error");
  }

  const shops = (shopRows ?? []).filter(
    (s: any) => s && typeof s.slug === "string" && s.slug.length > 0
  );

  // 3) 0 shops -> send them to create
  if (shops.length === 0) {
    redirect("/merchant/create");
  }

  // 4) 1 shop -> go straight there
  if (shops.length === 1) {
    redirect(`/merchant/${shops[0].slug}`);
  }

  // 5) Multiple shops -> show a selector (no redirect so we don't 404/loop)
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-2xl font-semibold">Choose a shop</h1>
      <p className="mt-2 text-sm text-neutral-400">
        Your account has access to multiple shops. Pick one to open its dashboard.
      </p>

      <div className="mt-6 grid gap-3">
        {shops.map((shop: any) => (
          <Link
            key={shop.id ?? shop.slug}
            href={`/merchant/${shop.slug}`}
            className="rounded-xl border border-neutral-800 bg-neutral-950/60 px-4 py-3 hover:bg-neutral-900"
          >
            <div className="text-sm text-neutral-400">Shop</div>
            <div className="text-lg font-medium text-white">{shop.slug}</div>
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
    </main>
  );
}