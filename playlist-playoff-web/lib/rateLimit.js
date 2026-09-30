const buckets = (globalThis.__rateBuckets ??= new Map());
const MAX_BUCKETS = 10000;

export function clientIp(request) {
  const h = request.headers;
  const ip =
    h.get('cf-connecting-ip') ||
    h.get('true-client-ip') ||
    h.get('x-forwarded-for')?.split(',')[0] ||
    h.get('x-real-ip') ||
    'unknown';
  return ip.trim();
}

function retryAfterSeconds(request, name, limit, windowMs) {
  const now = Date.now();
  const key = `${name}:${clientIp(request)}`;
  let bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    if (buckets.size >= MAX_BUCKETS) {
      for (const [k, v] of buckets) if (v.resetAt <= now) buckets.delete(k);
      while (buckets.size >= MAX_BUCKETS) buckets.delete(buckets.keys().next().value);
    }
    bucket = { count: 0, resetAt: now + windowMs };
    buckets.set(key, bucket);
  }
  bucket.count += 1;
  return bucket.count > limit ? Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)) : 0;
}

export function limited(request, name, limit, windowMs) {
  const retry = retryAfterSeconds(request, name, limit, windowMs);
  if (!retry) return null;
  return Response.json(
    { error: 'Too many requests. Please slow down and try again shortly.' },
    { status: 429, headers: { 'Retry-After': String(retry) } }
  );
}
