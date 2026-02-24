import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { ArrowRight } from "lucide-react";

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
      <main className="flex min-h-screen items-center justify-center bg-black px-8 text-[#ededed]">
        <div className="w-full max-w-md text-center">
          <p className="text-[11px] font-light tracking-[0.5em] text-[#555]">
            ERROR
          </p>
          <h1 className="mt-6 text-3xl font-extralight tracking-[-0.02em]">
            Something went wrong
          </h1>
          <p className="mt-4 text-[15px] font-light text-[#666]">
            Could not load your shops. Please try again later.
          </p>
        </div>
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

  // Multiple shops — show selector
  return (
    <main className="min-h-screen bg-black text-[#ededed]">
      {/* Radial glow */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(255,255,255,0.03),transparent)]" />

      <div className="relative mx-auto max-w-3xl px-8 pb-20 pt-28">
        <p className="text-[11px] font-light tracking-[0.5em] text-[#555]">
          MERCHANT DASHBOARD
        </p>
        <h1 className="mt-4 text-4xl font-extralight tracking-[-0.02em] text-white sm:text-5xl">
          Your shops
        </h1>
        <p className="mt-4 text-[15px] font-light leading-[1.7] text-[#666]">
          Your account has access to multiple shops. Choose one to open its
          dashboard.
        </p>

        <div className="mt-12 space-y-0">
          {shops.map((shop: any) => (
            <Link
              key={shop.id ?? shop.slug}
              href={`/merchant/${shop.slug}`}
              className="group flex items-center justify-between gap-4 border-t border-[#161616] py-6 transition-colors duration-500 hover:border-[#333]"
            >
              <div className="flex items-center gap-4">
                <span className="text-[15px] font-normal tracking-[0.02em] text-white transition-colors duration-300 group-hover:text-[#ededed]">
                  {shop.slug}
                </span>
                <span
                  className={`rounded-full border px-3 py-1 text-[10px] font-light tracking-[0.15em] ${
                    shop.is_paid
                      ? "border-emerald-800/50 text-emerald-400"
                      : "border-[#1a1a1a] text-[#555]"
                  }`}
                >
                  {shop.is_paid ? "Active" : "Inactive"}
                </span>
              </div>
              <ArrowRight className="h-4 w-4 text-[#333] transition-colors duration-300 group-hover:text-[#888]" />
            </Link>
          ))}
          <div className="border-t border-[#161616]" />
        </div>

        <div className="mt-10">
          <Link
            href="/merchant/create"
            className="inline-flex items-center gap-3 rounded-full border border-[#333] px-6 py-2.5 text-[12px] font-light tracking-[0.1em] text-[#ededed] transition-all duration-500 hover:border-[#666] hover:bg-white/5"
          >
            Create another shop
          </Link>
        </div>
      </div>
    </main>
  );
}
