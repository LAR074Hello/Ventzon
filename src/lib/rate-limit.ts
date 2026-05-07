// src/lib/rate-limit.ts
//
// Persistent sliding-window rate limiter backed by Upstash Redis.
// All Vercel serverless instances share the same counters, so limits
// hold across cold starts and parallel instances.
//
// Falls back to a simple in-memory limiter if Upstash env vars aren't
// set (e.g. local dev without Redis configured).

import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

// ---------------------------------------------------------------------------
// Upstash-backed limiter (production)
// ---------------------------------------------------------------------------

let redis: Redis | null = null;

function getRedis(): Redis | null {
  if (redis) return redis;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  redis = new Redis({ url, token });
  return redis;
}

// Cache of Ratelimit instances keyed by "limit:windowMs"
const limiters = new Map<string, Ratelimit>();

function getLimiter(limit: number, windowMs: number): Ratelimit | null {
  const r = getRedis();
  if (!r) return null;

  const key = `${limit}:${windowMs}`;
  if (!limiters.has(key)) {
    limiters.set(
      key,
      new Ratelimit({
        redis: r,
        limiter: Ratelimit.slidingWindow(limit, `${windowMs} ms`),
        analytics: false,
      })
    );
  }
  return limiters.get(key)!;
}

// ---------------------------------------------------------------------------
// In-memory fallback (local dev / no Redis)
// ---------------------------------------------------------------------------

type Entry = { timestamps: number[] };
const store = new Map<string, Entry>();
const CLEANUP_INTERVAL = 60_000;
let lastCleanup = Date.now();

function cleanupMemory(windowMs: number) {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  const cutoff = now - windowMs;
  for (const [k, entry] of store) {
    entry.timestamps = entry.timestamps.filter((t) => t > cutoff);
    if (entry.timestamps.length === 0) store.delete(k);
  }
}

function memoryRateLimit(
  key: string,
  limit: number,
  windowMs: number
): { limited: boolean; remaining: number; retryAfterMs: number } {
  cleanupMemory(windowMs);
  const now = Date.now();
  const cutoff = now - windowMs;
  let entry = store.get(key);
  if (!entry) {
    entry = { timestamps: [] };
    store.set(key, entry);
  }
  entry.timestamps = entry.timestamps.filter((t) => t > cutoff);
  if (entry.timestamps.length >= limit) {
    const retryAfterMs = Math.max(entry.timestamps[0] + windowMs - now, 0);
    return { limited: true, remaining: 0, retryAfterMs };
  }
  entry.timestamps.push(now);
  return { limited: false, remaining: limit - entry.timestamps.length, retryAfterMs: 0 };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Check whether a request should be rate-limited.
 *
 * @param key      Unique identifier (usually IP + route)
 * @param limit    Max requests allowed in the window
 * @param windowMs Window duration in milliseconds (default 60s)
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowMs: number = 60_000
): Promise<{ limited: boolean; remaining: number; retryAfterMs: number }> {
  const limiter = getLimiter(limit, windowMs);

  if (limiter) {
    const { success, remaining, reset } = await limiter.limit(key);
    const retryAfterMs = success ? 0 : Math.max(reset - Date.now(), 0);
    return { limited: !success, remaining, retryAfterMs };
  }

  // Fallback: in-memory (local dev)
  return memoryRateLimit(key, limit, windowMs);
}

/**
 * Extract a best-effort client IP from request headers.
 * Works on Vercel (x-forwarded-for) and most reverse proxies.
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
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
