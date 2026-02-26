// src/proxy.ts
// Next.js 16 proxy (replaces middleware.ts).
// 1) Refreshes Supabase session tokens on every matched request.
// 2) Protects /merchant/* page routes — unauthenticated users are redirected to /login.

import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    // If env vars are missing, just pass through — the app will fail elsewhere with a clear error.
    return supabaseResponse;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        // 1) Write cookies onto the request (for downstream server components)
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );

        // 2) Re-create the response so it carries the updated request cookies
        supabaseResponse = NextResponse.next({ request });

        // 3) Write cookies onto the response (for the browser)
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // Calling getUser() triggers an automatic token refresh if the access token
  // is expired. The refreshed tokens are written back via setAll() above.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protect /merchant/* page routes (API routes handle their own auth)
  const { pathname } = request.nextUrl;
  const isMerchantPage = pathname.startsWith("/merchant");

  if (isMerchantPage && !user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return supabaseResponse;
}

// Run proxy on routes that need session refresh or auth protection.
export const config = {
  matcher: [
    "/merchant/:path*",
    "/login",
    "/signup",
    "/reset-password",
    "/forgot-password",
    "/get-started",
  ],
};
