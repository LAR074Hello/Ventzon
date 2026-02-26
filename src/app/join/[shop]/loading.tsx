export default function JoinShopLoading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-6 pb-12 pt-24">
      <div className="w-full max-w-sm text-center">
        {/* Logo circle skeleton */}
        <div className="mx-auto h-20 w-20 animate-pulse rounded-full border border-[#111] bg-[#0a0a0a]" />

        {/* Shop name skeleton */}
        <div className="mx-auto mt-6 h-8 w-40 animate-pulse rounded bg-[#111]" />

        {/* Deal pill skeleton */}
        <div className="mx-auto mt-4 h-6 w-52 animate-pulse rounded-full bg-[#0d0d0d]" />

        {/* Phone input skeleton */}
        <div className="mt-10 h-14 w-full animate-pulse rounded-lg bg-[#0a0a0a]" />

        {/* Button skeleton */}
        <div className="mt-4 h-12 w-full animate-pulse rounded-full bg-[#111]" />
      </div>
    </main>
  );
}
