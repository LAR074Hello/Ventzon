// src/app/merchant/subscribe/page.tsx
import SubscribeContent from "./SubscribeContent";

export default async function MerchantSubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ shop?: string }>;
}) {
  const { shop } = await searchParams;
  const shopSlug = (shop ?? "").trim().toLowerCase();
  return (
    <main className="min-h-screen bg-night-950 text-fog-100">
      <SubscribeContent shopSlug={shopSlug} />
    </main>
  );
}
