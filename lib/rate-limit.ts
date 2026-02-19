const rateLimit = new Map<string, { count: number; resetTime: number }>();

const WINDOW_MS = 60 * 1000; // 1 minute
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // Clean up every 5 minutes

// Periodically clean up expired entries to prevent memory leaks
if (typeof globalThis !== 'undefined') {
  const cleanup = () => {
    const now = Date.now();
    for (const [key, value] of rateLimit.entries()) {
      if (now > value.resetTime) {
        rateLimit.delete(key);
      }
    }
  };
  setInterval(cleanup, CLEANUP_INTERVAL_MS);
}

export function checkRateLimit(
  identifier: string,
  maxRequests: number = 10
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = rateLimit.get(identifier);

  if (!entry || now > entry.resetTime) {
    rateLimit.set(identifier, { count: 1, resetTime: now + WINDOW_MS });
    return { allowed: true, remaining: maxRequests - 1 };
  }

  if (entry.count >= maxRequests) {
    return { allowed: false, remaining: 0 };
  }

  entry.count++;
  return { allowed: true, remaining: maxRequests - entry.count };
}
