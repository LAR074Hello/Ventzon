/**
 * LaptopFrame — a premium desktop mockup for product showcases.
 * The desktop counterpart to DeviceFrame: dark bezel, warm shadow,
 * hairline ring, a centred camera dot, and a rounded 16:10 screen that
 * renders whatever the product is showing.
 */
export default function LaptopFrame({
  children,
  className = "",
  screenClassName = "",
}: {
  children: React.ReactNode;
  className?: string;
  screenClassName?: string;
}) {
  return (
    <div
      className={`relative rounded-[1.4rem] bg-night-900 p-2 shadow-warm-lg ring-1 ring-white/5 sm:rounded-[1.6rem] sm:p-3 ${className}`}
    >
      {/* Camera dot */}
      <div className="pointer-events-none absolute left-1/2 top-2.5 z-10 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-white/15 sm:top-3" />
      {/* Screen */}
      <div
        className={`relative aspect-[16/10] w-full overflow-hidden rounded-xl bg-night-950 ring-1 ring-white/5 sm:rounded-2xl ${screenClassName}`}
      >
        {children}
      </div>
    </div>
  );
}
