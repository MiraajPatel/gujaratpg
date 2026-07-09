/**
 * Shared helpers for the Cloudflare Pages Functions backend.
 * Runs on the Workers runtime (V8 isolate) — no Node built-ins.
 */

export const KNOWN_PROBLEMS = new Set([
  'eviction', 'homeless', 'financial', 'studies', 'job', 'safety',
  'health', 'no_alternative', 'short_notice', 'deposit_lost', 'other',
]);

// One shared realm string across every admin endpoint so the browser reuses the
// cached Basic-auth credentials for /api/admin/*, /admin/export.csv and /media/*.
export const ADMIN_REALM = 'Basic realm="Gujarat PG Org Admin", charset="UTF-8"';

/** JSON response with no-store caching (the wall + stats must reflect admin actions immediately). */
export function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...extraHeaders,
    },
  });
}

export function clean(value, max = 5000) {
  if (value == null) return '';
  return String(value).replace(/\s+$/g, '').trim().slice(0, max);
}

export function normalizePhone(raw) {
  const digits = String(raw || '').replace(/\D/g, '');
  let ten = digits;
  if (ten.length === 12 && ten.startsWith('91')) ten = ten.slice(2);
  else if (ten.length === 11 && ten.startsWith('0')) ten = ten.slice(1);
  return /^[6-9]\d{9}$/.test(ten) ? ten : null;
}

export function parseProblems(values) {
  let arr = [];
  if (Array.isArray(values)) arr = values;
  else if (typeof values === 'string' && values) arr = values.split(',');
  const tags = arr.map((s) => clean(s, 40)).filter((s) => KNOWN_PROBLEMS.has(s));
  return [...new Set(tags)];
}

export function safeParse(jsonStr) {
  try {
    const v = JSON.parse(jsonStr);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

const ID_ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyz';
export function nanoid(size = 12) {
  const bytes = crypto.getRandomValues(new Uint8Array(size));
  let out = '';
  for (let i = 0; i < size; i += 1) out += ID_ALPHABET[bytes[i] % ID_ALPHABET.length];
  return out;
}

function constantTimeEqual(a, b) {
  const enc = new TextEncoder();
  const ba = enc.encode(String(a));
  const bb = enc.encode(String(b));
  if (ba.length !== bb.length) return false;
  let diff = 0;
  for (let i = 0; i < ba.length; i += 1) diff |= ba[i] ^ bb[i];
  return diff === 0;
}

/**
 * Basic-auth guard for admin routes.
 * Returns `null` when authorised, otherwise a 401 Response with WWW-Authenticate.
 */
export function requireAdmin(request, env) {
  const header = request.headers.get('Authorization') || '';
  const [scheme, encoded] = header.split(' ');
  if (scheme === 'Basic' && encoded) {
    let decoded = '';
    try { decoded = atob(encoded); } catch { decoded = ''; }
    const idx = decoded.indexOf(':');
    const pass = idx >= 0 ? decoded.slice(idx + 1) : decoded;
    if (env.ADMIN_PASSWORD && constantTimeEqual(pass, env.ADMIN_PASSWORD)) return null;
  }
  return new Response('Authentication required.', {
    status: 401,
    headers: { 'WWW-Authenticate': ADMIN_REALM, 'Cache-Control': 'no-store' },
  });
}
