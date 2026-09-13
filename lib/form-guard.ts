import 'server-only';

import { createHmac } from 'crypto';
import { cmsServerClient } from '@/lib/supabase/cmsServer';
import { ELAPSED_FIELD, HONEYPOT_FIELD, MIN_FORM_ELAPSED_MS } from '@/lib/form-guard-fields';

export type FormGuardResult = { result: 'pass' } | { result: 'bot' } | { result: 'reject'; error: string };

/**
 * Honeypot + minimum time-on-form. A filled honeypot is a bot: callers answer
 * with a fake success so the bot learns nothing. A too-fast or missing timer
 * gets a friendly, retryable error because a hurried human can trip it too.
 */
export function checkFormGuard(body: Record<string, unknown>): FormGuardResult {
  const trap = body[HONEYPOT_FIELD];
  if (trap !== undefined && trap !== null && String(trap).trim() !== '') return { result: 'bot' };

  const rawElapsed = body[ELAPSED_FIELD];
  const elapsed = Number(rawElapsed);
  if (rawElapsed === undefined || rawElapsed === null || rawElapsed === '' || !Number.isFinite(elapsed)) {
    return { result: 'reject', error: 'Please refresh the page and try again.' };
  }
  if (elapsed < MIN_FORM_ELAPSED_MS) {
    return { result: 'reject', error: 'That was quick! Please take a moment to check your details, then submit again.' };
  }
  return { result: 'pass' };
}

function clientIp(req: Request) {
  // On Vercel both headers are set by the edge network, not the client.
  const realIp = req.headers.get('x-real-ip')?.trim();
  if (realIp) return realIp;
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
}

/** Salted HMAC of the client IP. Raw IPs are never stored. */
function rateLimitKey(req: Request) {
  const secret =
    process.env.RATE_LIMIT_SALT?.trim() || process.env.EMAIL_TOKEN_SECRET?.trim() || process.env.ADMIN_SESSION_SECRET?.trim();
  if (!secret) throw new Error('RATE_LIMIT_SALT, EMAIL_TOKEN_SECRET or ADMIN_SESSION_SECRET is required');
  return createHmac('sha256', secret).update(`rate-limit:${clientIp(req)}`).digest('hex');
}

/**
 * Serverless-safe rate limit: counts this key's hits in `beyon.rate_limit_hits`
 * over the window, then records the new hit. Returns true when the request
 * should be refused. Fails open (logs) if the database is unreachable, so a
 * storage hiccup never blocks a real inquiry.
 */
export async function isRateLimited(req: Request, bucket: string, options: { limit: number; windowSeconds: number }) {
  try {
    const supabase = cmsServerClient();
    const keyHash = rateLimitKey(req);
    const since = new Date(Date.now() - options.windowSeconds * 1000).toISOString();

    const { count, error } = await supabase
      .from('rate_limit_hits')
      .select('id', { count: 'exact', head: true })
      .eq('bucket', bucket)
      .eq('key_hash', keyHash)
      .gte('created_at', since);
    if (error) throw new Error(error.message);
    if ((count || 0) >= options.limit) return true;

    const inserted = await supabase.from('rate_limit_hits').insert({ bucket, key_hash: keyHash });
    if (inserted.error) throw new Error(inserted.error.message);
    return false;
  } catch (error) {
    console.error('Rate limit check failed; allowing request', {
      bucket,
      error: error instanceof Error ? error.message : String(error)
    });
    return false;
  }
}

export async function pruneRateLimitHits(olderThanHours = 24) {
  const cutoff = new Date(Date.now() - olderThanHours * 60 * 60 * 1000).toISOString();
  const supabase = cmsServerClient();
  const { error, count } = await supabase.from('rate_limit_hits').delete({ count: 'exact' }).lt('created_at', cutoff);
  if (error) throw new Error(error.message);
  return count || 0;
}
