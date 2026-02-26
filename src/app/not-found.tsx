import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-6 pt-24 pb-12">
      <div className="w-full max-w-md text-center">
        <p className="font-mono text-[64px] font-extralight text-[#1a1a1a]">
          404
        </p>
        <h1 className="mt-2 text-2xl font-extralight tracking-[-0.02em] text-[#ededed]">
          Page not found
        </h1>
        <p className="mt-3 text-[14px] font-light leading-relaxed text-[#555]">
          The page you&rsquo;re looking for doesn&rsquo;t exist or has been
          moved.
        </p>
        <div className="mt-10 flex justify-center gap-4">
          <Link
            href="/"
            className="rounded-full border border-[#ededed] px-6 py-2.5 text-[12px] font-light tracking-[0.15em] text-[#ededed] transition-all duration-500 hover:bg-[#ededed] hover:text-black"
          >
            Go home
          </Link>
          <Link
            href="/merchant/dashboard"
            className="rounded-full border border-[#333] px-6 py-2.5 text-[12px] font-light tracking-[0.15em] text-[#ededed] transition-all duration-500 hover:border-[#666] hover:bg-white/5"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
