// src/lib/rate-limit.ts
// Simple in-memory sliding-window rate limiter for Vercel serverless.
//
// Each warm function instance maintains its own window. This won't
// persist across cold starts, but effectively blocks rapid-fire abuse
// from a single IP during a warm period. For stricter limits at scale,
// swap this out for Upstash Redis (@upstash/ratelimit).

type Entry = { timestamps: number[] };

const store = new Map<string, Entry>();

// Clean up stale entries every 60 seconds to prevent memory leaks
const CLEANUP_INTERVAL = 60_000;
let lastCleanup = Date.now();

function cleanup(windowMs: number) {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;

  const cutoff = now - windowMs;
  for (const [key, entry] of store) {
    entry.timestamps = entry.timestamps.filter((t) => t > cutoff);
    if (entry.timestamps.length === 0) store.delete(key);
  }
}

/**
 * Check whether a request should be rate-limited.
 *
 * @param key      Unique identifier (usually IP + route)
 * @param limit    Max requests allowed in the window
 * @param windowMs Window duration in milliseconds (default 60s)
 * @returns        { limited: boolean, remaining: number, retryAfterMs: number }
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number = 60_000
): { limited: boolean; remaining: number; retryAfterMs: number } {
  cleanup(windowMs);

  const now = Date.now();
  const cutoff = now - windowMs;

  let entry = store.get(key);
  if (!entry) {
    entry = { timestamps: [] };
    store.set(key, entry);
  }

  // Remove timestamps outside the window
  entry.timestamps = entry.timestamps.filter((t) => t > cutoff);

  if (entry.timestamps.length >= limit) {
    // Rate limited
    const oldestInWindow = entry.timestamps[0];
    const retryAfterMs = oldestInWindow + windowMs - now;
    return {
      limited: true,
      remaining: 0,
      retryAfterMs: Math.max(retryAfterMs, 0),
    };
  }

  // Allow request
  entry.timestamps.push(now);
  return {
    limited: false,
    remaining: limit - entry.timestamps.length,
    retryAfterMs: 0,
  };
}

/**
 * Extract a best-effort client IP from request headers.
 * Works on Vercel (x-forwarded-for) and most reverse proxies.
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    // x-forwarded-for can be "client, proxy1, proxy2"
    return forwarded.split(",")[0].trim();
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "unknown";
}

/**
 * Build a standard 429 response.
 */
export function rateLimitResponse(retryAfterMs: number) {
  const retryAfterSec = Math.ceil(retryAfterMs / 1000);
  return new Response(
    JSON.stringify({ error: "Too many requests. Please try again shortly." }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(retryAfterSec),
      },
    }
  );
}
