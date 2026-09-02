export default function MerchantDashboardLoading() {
  return (
    <main className="min-h-screen bg-surface text-primary">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(90,30,36,0.10),transparent)]" />

      <div className="relative mx-auto max-w-3xl px-8 pb-20 pt-28">
        {/* Label skeleton */}
        <div className="h-3 w-32 animate-pulse rounded bg-surface-sunken" />

        {/* Title skeleton */}
        <div className="mt-6 h-10 w-48 animate-pulse rounded bg-surface-sunken" />

        {/* Subtitle skeleton */}
        <div className="mt-5 h-4 w-72 animate-pulse rounded bg-surface-sunken" />

        {/* Card skeletons */}
        <div className="mt-10 space-y-4">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-xl border border-subtle px-8 py-6"
            >
              <div className="flex items-center gap-4">
                <div className="h-5 w-28 animate-pulse rounded bg-surface-sunken" />
                <div className="h-5 w-16 animate-pulse rounded-full bg-surface-sunken" />
              </div>
              <div className="h-4 w-4 animate-pulse rounded bg-surface-sunken" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
