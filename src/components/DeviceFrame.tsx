/**
 * DeviceFrame — a phone shell for product screenshots/mockups.
 *
 * Static (no float), slightly rotated by the caller, warm diffuse shadow.
 * The screen content is rendered as children so mockups use the page's own
 * tokens rather than static images.
 */
export default function DeviceFrame({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`relative w-[280px] rounded-[2.6rem] bg-night-900 p-2.5 shadow-warm-lg sm:w-[300px] ${className}`}>
      {/* Dynamic island */}
      <div className="absolute left-1/2 top-5 z-10 h-5 w-20 -translate-x-1/2 rounded-full bg-black/90" />
      {/* Screen */}
      <div className="aspect-[9/19] w-full overflow-hidden rounded-[2.1rem] bg-night-800">
        {children}
      </div>
    </div>
  );
}
