export default function ShopDashboardLoading() {
  return (
    <main className="min-h-screen bg-black text-[#ededed]">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(255,255,255,0.03),transparent)]" />

      <div className="relative mx-auto max-w-5xl px-8 pb-20 pt-28">
        {/* Label skeleton */}
        <div className="h-3 w-36 animate-pulse rounded bg-[#111]" />

        {/* Title skeleton */}
        <div className="mt-6 h-12 w-56 animate-pulse rounded bg-[#111]" />

        {/* Status bar skeleton */}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <div className="h-7 w-24 animate-pulse rounded-full bg-[#0d0d0d]" />
          <div className="h-7 w-16 animate-pulse rounded-full bg-[#0d0d0d]" />
        </div>

        {/* Stats grid skeleton */}
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-2xl border border-[#111] p-8"
            >
              <div className="h-3 w-24 animate-pulse rounded bg-[#111]" />
              <div className="mt-5 h-12 w-16 animate-pulse rounded bg-[#111]" />
              <div className="mt-4 h-3 w-20 animate-pulse rounded bg-[#0d0d0d]" />
            </div>
          ))}
        </div>

        {/* QR section skeleton */}
        <div className="mt-14">
          <div className="mx-auto mb-14 h-px max-w-xs bg-[#111]" />
          <div className="rounded-2xl border border-[#111] p-8 sm:p-10">
            <div className="grid items-center gap-10 lg:grid-cols-[auto_1fr]">
              <div className="h-[212px] w-[212px] animate-pulse rounded-2xl bg-[#0d0d0d]" />
              <div>
                <div className="h-3 w-20 animate-pulse rounded bg-[#111]" />
                <div className="mt-4 h-7 w-48 animate-pulse rounded bg-[#111]" />
                <div className="mt-6 h-14 w-full animate-pulse rounded-xl bg-[#0d0d0d]" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
