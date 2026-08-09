/**
 * Rate-limit por ventana fija (in-memory, por instancia).
 *
 * Suficiente para disuadir abuso en endpoints públicos (webhooks, forms):
 * cada petición incrementa un contador por `key` dentro de `windowMs`; al
 * superar `limit` la petición se rechaza. En serverless cada instancia tiene
 * su propio mapa, así que el límite real es ~limit × instancias; el objetivo
 * aquí es cortar ráfagas y scraping, no sustituir un WAF.
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

function sweep(now: number) {
  if (buckets.size < 5000) return;
  for (const [key, b] of buckets) {
    if (b.resetAt <= now) buckets.delete(key);
  }
}

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  resetAt: number;
  retryAfterSec: number;
}

/** Revisa (e incrementa) el contador de `key`. Devuelve si la petición pasa. */
export function rateLimit(
  key: string,
  limit = 30,
  windowMs = 60_000
): RateLimitResult {
  const now = Date.now();
  sweep(now);

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, resetAt: now + windowMs, retryAfterSec: Math.ceil(windowMs / 1000) };
  }

  if (bucket.count >= limit) {
    return { ok: false, remaining: 0, resetAt: bucket.resetAt, retryAfterSec: Math.ceil((bucket.resetAt - now) / 1000) };
  }

  bucket.count += 1;
  return { ok: true, remaining: limit - bucket.count, resetAt: bucket.resetAt, retryAfterSec: Math.ceil((bucket.resetAt - now) / 1000) };
}

/** Extrae la IP del cliente de forma defensiva. */
export function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}
