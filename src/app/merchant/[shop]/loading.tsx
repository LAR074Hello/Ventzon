export default function ShopDashboardLoading() {
  return (
    <main className="min-h-screen bg-surface text-primary">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(90,30,36,0.10),transparent)]" />

      <div className="relative mx-auto max-w-5xl px-8 pb-20 pt-28">
        {/* Label skeleton */}
        <div className="h-3 w-36 animate-pulse rounded bg-surface-sunken" />

        {/* Title skeleton */}
        <div className="mt-6 h-12 w-56 animate-pulse rounded bg-surface-sunken" />

        {/* Status bar skeleton */}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <div className="h-7 w-24 animate-pulse rounded-full bg-surface-sunken" />
          <div className="h-7 w-16 animate-pulse rounded-full bg-surface-sunken" />
        </div>

        {/* Stats grid skeleton */}
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-xl border border-subtle p-8"
            >
              <div className="h-3 w-24 animate-pulse rounded bg-surface-sunken" />
              <div className="mt-5 h-12 w-16 animate-pulse rounded bg-surface-sunken" />
              <div className="mt-4 h-3 w-20 animate-pulse rounded bg-surface-sunken" />
            </div>
          ))}
        </div>

        {/* QR section skeleton */}
        <div className="mt-10">
          <div className="mx-auto mb-14 h-px max-w-xs bg-surface-sunken" />
          <div className="rounded-xl border border-subtle p-8 sm:p-10">
            <div className="grid items-center gap-10 lg:grid-cols-[auto_1fr]">
              <div className="h-[212px] w-[212px] animate-pulse rounded-xl bg-surface-sunken" />
              <div>
                <div className="h-3 w-20 animate-pulse rounded bg-surface-sunken" />
                <div className="mt-4 h-7 w-48 animate-pulse rounded bg-surface-sunken" />
                <div className="mt-6 h-14 w-full animate-pulse rounded-xl bg-surface-sunken" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
