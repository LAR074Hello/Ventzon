import { redirect } from "next/navigation";
import Link from "next/link";

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
    <main className="flex min-h-screen items-center justify-center bg-black px-6 pt-24 pb-12">
      <div className="w-full max-w-md text-center">
        <p className="text-[11px] font-light tracking-[0.3em] text-[#555]">
          VENTZON REWARDS
        </p>
        <h1 className="mt-4 text-3xl font-extralight tracking-[-0.02em] text-[#ededed] sm:text-4xl">
          Missing shop
        </h1>
        <p className="mt-5 text-[14px] font-light leading-relaxed text-[#555]">
          This link doesn&rsquo;t point to a shop. Try scanning the QR code
          at the register, or open a link like{" "}
          <span className="font-mono text-[#666]">/join/your-shop</span>
        </p>
        <Link
          href="/"
          className="mt-10 inline-block text-[12px] font-light tracking-[0.1em] text-[#444] transition-colors duration-300 hover:text-[#ededed]"
        >
          Go to homepage
        </Link>
      </div>
    </main>
  );
}
