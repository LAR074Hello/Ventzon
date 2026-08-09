// src/app/pricing/page.tsx
import PricingContent from "./PricingContent";

export default async function PricingPage({
  searchParams,
}: {
  searchParams: Promise<{ shop?: string }>;
}) {
  const { shop } = await searchParams;
  return <PricingContent shopFromQuery={(shop ?? "").trim()} />;
}
