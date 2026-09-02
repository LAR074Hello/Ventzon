import Link from "next/link";
import Image from "next/image";
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
      <main className="flex min-h-screen items-center justify-center bg-surface px-8 text-primary">
        <div className="w-full max-w-md text-center">
          <p className="text-2xs font-medium tracking-caps text-muted">
            ERROR
          </p>
          <h1 className="mt-6 text-3xl font-medium tracking-[-0.02em]">
            Something went wrong
          </h1>
          <p className="mt-4 text-[15px] font-normal text-muted">
            Could not load your shops. Please try again later.
          </p>
        </div>
      </main>
    );
  }

  const shops = ((shopRows ?? []) as Array<{
    id: string;
    slug: string;
    is_paid: boolean | null;
  }>).filter((s) => s && typeof s.slug === "string" && s.slug.length > 0);

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
    <main className="min-h-screen bg-surface text-primary">
      <div className="mx-auto max-w-3xl px-4 pb-24 pt-10 sm:px-6">
        <div className="mb-8 flex items-center gap-2.5">
          <div className="h-7 w-7 overflow-hidden rounded-lg bg-surface-sunken ring-1 ring-strong">
            <Image
              src="/logo.png"
              alt="Ventzon"
              width={28}
              height={28}
              className="h-full w-full object-cover"
            />
          </div>
          <span className="text-2xs font-medium uppercase tracking-caps text-secondary">
            Ventzon merchant
          </span>
        </div>

        <p className="text-2xs font-medium uppercase tracking-caps text-muted">
          Merchant dashboard
        </p>
        <h1 className="mt-2 font-display text-3xl font-medium tracking-tight text-primary sm:text-4xl">
          Your shops
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">
          Your account has access to multiple shops. Choose one to open its
          dashboard.
        </p>

        <div className="mt-10 overflow-hidden rounded-xl border border-subtle bg-surface-raised">
          {shops.map((shop, i: number) => (
            <Link
              key={shop.id ?? shop.slug}
              href={`/merchant/${shop.slug}`}
              className={`group flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-surface-sunken/50 sm:px-6 ${
                i > 0 ? "border-t border-subtle" : ""
              }`}
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="truncate text-base font-medium text-primary">
                  {shop.slug}
                </span>
                <span
                  className={`shrink-0 rounded-md border px-2 py-0.5 text-2xs font-medium uppercase tracking-caps ${
                    shop.is_paid
                      ? "border-positive/40 bg-positive/10 text-positive"
                      : "border-subtle text-muted"
                  }`}
                >
                  {shop.is_paid ? "Active" : "Inactive"}
                </span>
              </div>
              <ArrowRight className="h-4 w-4 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-secondary" />
            </Link>
          ))}
        </div>

        <div className="mt-6">
          <Link
            href="/merchant/create"
            className="inline-flex items-center gap-2 rounded-lg border border-strong px-4 py-2 text-sm font-medium text-secondary transition-colors hover:bg-surface-sunken/60 hover:text-primary"
          >
            Create another shop
          </Link>
        </div>
      </div>
    </main>
  );
}
