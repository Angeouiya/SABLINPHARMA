import { NextRequest, NextResponse } from "next/server";

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

export type RateLimitOptions = {
  key: string;
  limit: number;
  windowMs: number;
};

const buckets = new Map<string, RateLimitBucket>();
const MAX_BUCKETS = 20_000;

function clientAddress(req: NextRequest) {
  const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = req.headers.get("x-real-ip")?.trim();
  return forwarded || realIp || "unknown";
}

function cleanupBuckets(now: number) {
  if (buckets.size < MAX_BUCKETS) return;
  for (const [key, bucket] of buckets.entries()) {
    if (bucket.resetAt <= now) buckets.delete(key);
    if (buckets.size < MAX_BUCKETS * 0.8) break;
  }
}

export function rateLimit(req: NextRequest, options: RateLimitOptions) {
  if (process.env.SABLIN_RATE_LIMIT_DISABLED === "true" && process.env.NODE_ENV !== "production") {
    return null;
  }

  const now = Date.now();
  cleanupBuckets(now);

  const userAgent = req.headers.get("user-agent")?.slice(0, 80) ?? "unknown-agent";
  const identifier = `${options.key}:${clientAddress(req)}:${userAgent}`;
  const bucket = buckets.get(identifier);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(identifier, { count: 1, resetAt: now + options.windowMs });
    return null;
  }

  bucket.count += 1;
  const remaining = Math.max(0, options.limit - bucket.count);
  const retryAfterSeconds = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));

  if (bucket.count <= options.limit) {
    return null;
  }

  return NextResponse.json(
    {
      error: "Trop de requêtes. Veuillez patienter avant de réessayer.",
      retryAfter: retryAfterSeconds,
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfterSeconds),
        "X-RateLimit-Limit": String(options.limit),
        "X-RateLimit-Remaining": String(remaining),
        "X-RateLimit-Reset": String(Math.ceil(bucket.resetAt / 1000)),
      },
    }
  );
}

export function rateLimitForPath(pathname: string): RateLimitOptions {
  if (pathname.includes("/webhook")) {
    return { key: `webhook:${pathname}`, limit: 600, windowMs: 60_000 };
  }
  if (pathname.includes("/auth/login") || pathname.includes("-auth/login")) {
    return { key: `login:${pathname}`, limit: 12, windowMs: 60_000 };
  }
  if (pathname.includes("password-reset")) {
    return { key: `password-reset:${pathname}`, limit: 6, windowMs: 15 * 60_000 };
  }
  if (pathname.includes("/imports") || pathname.includes("import") || pathname.includes("upload")) {
    return { key: `imports:${pathname}`, limit: 30, windowMs: 10 * 60_000 };
  }
  if (pathname.includes("/enrichment") || pathname.includes("/products/search-images")) {
    return { key: `enrichment:${pathname}`, limit: 40, windowMs: 10 * 60_000 };
  }
  if (pathname.includes("/payments") || pathname.includes("/payment")) {
    return { key: `payments:${pathname}`, limit: 60, windowMs: 60_000 };
  }
  return { key: `api:${pathname}`, limit: 180, windowMs: 60_000 };
}
