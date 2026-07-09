import { json, clean, normalizePhone, parseProblems, nanoid } from '../_shared.js';

const ALLOWED_VIDEO = new Set([
  'video/mp4', 'video/quicktime', 'video/webm',
  'video/x-matroska', 'video/3gpp', 'video/x-msvideo',
]);

const HOUR_MS = 60 * 60 * 1000;
const MAX_PER_IP_PER_HOUR = 8;

// Submit a story (multipart form, optional video file OR external link).
export async function onRequestPost({ request, env }) {
  const maxVideoMb = Number(env.MAX_VIDEO_MB || 60);

  let form;
  try {
    form = await request.formData();
  } catch {
    return json({ ok: false, error: 'SERVER_ERROR' }, 400);
  }
  const g = (k) => form.get(k);

  // Honeypot: bots fill the hidden "website" field. Pretend success, store nothing.
  if (clean(g('website'), 200)) return json({ ok: true, id: 'skipped' });

  const full_name = clean(g('full_name'), 120);
  const phone = normalizePhone(g('phone'));
  const city = clean(g('city'), 80);
  const pg_name = clean(g('pg_name'), 160);
  const story = clean(g('story'), 8000);

  const missing = [];
  if (!full_name) missing.push('full_name');
  if (!phone) missing.push('phone');
  if (!city) missing.push('city');
  if (!pg_name) missing.push('pg_name');
  if (story.length < 20) missing.push('story');
  if (missing.length) return json({ ok: false, error: 'VALIDATION', fields: missing }, 400);

  // Rate limit: max 8 stored submissions per IP per hour.
  const ip = (request.headers.get('CF-Connecting-IP') || '').slice(0, 60);
  if (ip) {
    const since = new Date(Date.now() - HOUR_MS).toISOString();
    try {
      const r = await env.DB
        .prepare('SELECT COUNT(*) AS n FROM submissions WHERE ip = ? AND created_at > ?')
        .bind(ip, since)
        .first();
      if (r && r.n >= MAX_PER_IP_PER_HOUR) return json({ ok: false, error: 'RATE_LIMITED' }, 429);
    } catch {
      // If the count fails, don't block a genuine submission.
    }
  }

  // Optional video upload → R2.
  let video_file = null;
  const file = form.get('video');
  if (file && typeof file === 'object' && typeof file.size === 'number' && file.size > 0) {
    if (!ALLOWED_VIDEO.has(file.type)) return json({ ok: false, error: 'UNSUPPORTED_VIDEO_TYPE' }, 400);
    if (file.size > maxVideoMb * 1024 * 1024) return json({ ok: false, error: 'VIDEO_TOO_LARGE' }, 400);
    const name = file.name || '';
    const ext = name.includes('.') ? name.slice(name.lastIndexOf('.')).slice(0, 12) : '.mp4';
    const key = `${Date.now()}-${nanoid()}${ext}`;
    try {
      await env.MEDIA.put(key, file, { httpMetadata: { contentType: file.type || 'video/mp4' } });
      video_file = key;
    } catch {
      return json({ ok: false, error: 'SERVER_ERROR' }, 500);
    }
  }

  let video_link = clean(g('video_link'), 500);
  if (video_link && !/^https?:\/\//i.test(video_link)) video_link = '';

  const consentRaw = g('consent_public');
  const consent_public = (consentRaw === 'true' || consentRaw === 'on' || consentRaw === '1') ? 1 : 0;

  const row = {
    id: nanoid(),
    created_at: new Date().toISOString(),
    full_name,
    phone,
    email: clean(g('email'), 160),
    city,
    state: clean(g('state'), 80),
    pg_name,
    pg_area: clean(g('pg_area'), 160),
    resident_type: clean(g('resident_type'), 40),
    duration: clean(g('duration'), 60),
    problems: JSON.stringify(parseProblems(form.getAll('problems'))),
    story,
    what_they_want: clean(g('what_they_want'), 4000),
    video_file,
    video_link: video_link || null,
    consent_public,
    status: 'pending',
    ip,
    user_agent: clean(request.headers.get('user-agent'), 300),
  };

  try {
    await env.DB.prepare(
      `INSERT INTO submissions
        (id, created_at, full_name, phone, email, city, state, pg_name, pg_area,
         resident_type, duration, problems, story, what_they_want,
         video_file, video_link, consent_public, status, ip, user_agent)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    ).bind(
      row.id, row.created_at, row.full_name, row.phone, row.email, row.city, row.state,
      row.pg_name, row.pg_area, row.resident_type, row.duration, row.problems, row.story,
      row.what_they_want, row.video_file, row.video_link, row.consent_public, row.status,
      row.ip, row.user_agent,
    ).run();
  } catch {
    if (video_file) { try { await env.MEDIA.delete(video_file); } catch { /* best effort */ } }
    return json({ ok: false, error: 'SERVER_ERROR' }, 500);
  }

  return json({ ok: true, id: row.id });
}
