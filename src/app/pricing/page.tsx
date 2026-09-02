// src/app/pricing/page.tsx
import PricingContent from "./PricingContent";

export default async function PricingPage({
  searchParams,
}: {
  searchParams: Promise<{ shop?: string; shop_name?: string; canceled?: string }>;
}) {
  const { shop, shop_name } = await searchParams;
  return (
    <PricingContent
      shopFromQuery={(shop ?? "").trim()}
      shopNameFromQuery={(shop_name ?? "").trim()}
    />
  );
}
