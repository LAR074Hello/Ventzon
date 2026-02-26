export default function MerchantDashboardLoading() {
  return (
    <main className="min-h-screen bg-black text-[#ededed]">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(255,255,255,0.03),transparent)]" />

      <div className="relative mx-auto max-w-3xl px-8 pb-20 pt-28">
        {/* Label skeleton */}
        <div className="h-3 w-32 animate-pulse rounded bg-[#111]" />

        {/* Title skeleton */}
        <div className="mt-6 h-10 w-48 animate-pulse rounded bg-[#111]" />

        {/* Subtitle skeleton */}
        <div className="mt-5 h-4 w-72 animate-pulse rounded bg-[#0d0d0d]" />

        {/* Card skeletons */}
        <div className="mt-14 space-y-4">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-2xl border border-[#111] px-8 py-6"
            >
              <div className="flex items-center gap-4">
                <div className="h-5 w-28 animate-pulse rounded bg-[#111]" />
                <div className="h-5 w-16 animate-pulse rounded-full bg-[#0d0d0d]" />
              </div>
              <div className="h-4 w-4 animate-pulse rounded bg-[#0d0d0d]" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
