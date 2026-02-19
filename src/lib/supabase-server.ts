// src/lib/supabase-server.ts
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

/**
 * Server-side Supabase client for Next.js App Router.
 *
 * IMPORTANT:
 * - `cookies()` is async in newer Next.js types, so we `await` it.
 * - In Server Components, cookies are READ-ONLY. Do NOT write cookies here.
 * - Do auth cookie writes in Middleware or Route Handlers / Server Actions.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      // Read cookies only here. Writing cookies in Server Components throws.
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {
          // Intentionally NO-OP in Server Components.
          // Cookie writes must happen in Middleware or Route Handlers.
        },
      },
      // Prevent the client from trying to refresh/persist session automatically
      // from a Server Component (which would attempt to write cookies).
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    }
  );
}