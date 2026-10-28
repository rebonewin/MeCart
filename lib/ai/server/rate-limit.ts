import "server-only";

import { createHash } from "node:crypto";

type Bucket = {
  count: number;
  resetAt: number;
};

export type RateLimitConfig = {
  windowMs: number;
  userLimit: number;
  ipLimit: number;
};

export type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  retryAfterSeconds: number;
};

const buckets = new Map<string, Bucket>();
let lastSweep = 0;

function clampInt(value: unknown, fallback: number, min: number, max: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, Math.trunc(parsed)));
}

export function getRateLimitConfig(): RateLimitConfig {
  const isDevelopment = process.env.NODE_ENV === "development";
  return {
    windowMs: clampInt(
      process.env.AI_RATE_LIMIT_WINDOW_MS,
      5 * 60_000,
      10_000,
      60 * 60_000,
    ),
    userLimit: clampInt(
      process.env.AI_RATE_LIMIT_MAX,
      isDevelopment ? 120 : 20,
      1,
      500,
    ),
    ipLimit: clampInt(
      process.env.AI_RATE_LIMIT_IP_MAX,
      isDevelopment ? 240 : 60,
      1,
      2_000,
    ),
  };
}

/**
 * Best-effort, per-instance sliding window.
 *
 * On a multi-instance deployment each instance has its own window, so this is
 * a cheap abuse guard rather than a billing control. It is deliberately
 * dependency-free; add a shared store (Upstash, Redis, or a Supabase RPC) when
 * you need a globally exact quota.
 */
export function consumeRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();

  if (now - lastSweep > 60_000 || buckets.size > 10_000) {
    for (const [bucketKey, bucket] of buckets) {
      if (bucket.resetAt <= now) buckets.delete(bucketKey);
    }
    lastSweep = now;
  }

  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return {
      allowed: true,
      limit,
      remaining: Math.max(limit - 1, 0),
      retryAfterSeconds: Math.ceil(windowMs / 1000),
    };
  }

  current.count += 1;
  const allowed = current.count <= limit;
  return {
    allowed,
    limit,
    remaining: Math.max(limit - current.count, 0),
    retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
  };
}

export function clientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return (
    request.headers.get("x-real-ip") ??
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-vercel-forwarded-for") ??
    "local"
  );
}

export function hashRateKey(value: string) {
  const salt =
    process.env.AI_RATE_LIMIT_SALT ??
    process.env.AI_API_KEY ??
    "mecart-local-rate-limit";
  return createHash("sha256")
    .update(`${salt}:${value}`)
    .digest("hex")
    .slice(0, 32);
}
