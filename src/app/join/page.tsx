import { redirect } from "next/navigation";

export default function JoinShopPage({
  params,
}: {
  params: { shop: string };
}) {
  const shopSlug = String(params?.shop ?? "").trim().toLowerCase();

  if (!shopSlug) redirect("/join");

  redirect(`/join?shop_slug=${encodeURIComponent(shopSlug)}`);
}