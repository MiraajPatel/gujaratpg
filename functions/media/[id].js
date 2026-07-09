import { requireAdmin } from '../_shared.js';

// Serve an uploaded video from R2. Public only if the story is approved +
// consented; otherwise it requires admin auth. Supports HTTP range requests so
// <video> seeking works.
export async function onRequestGet({ request, env, params }) {
  const row = await env.DB
    .prepare('SELECT status, consent_public, video_file FROM submissions WHERE id = ?')
    .bind(params.id)
    .first();

  if (!row || !row.video_file) return new Response(null, { status: 404 });

  const isPublic = row.status === 'approved' && row.consent_public === 1;
  if (!isPublic) {
    const unauthorised = requireAdmin(request, env);
    if (unauthorised) return unauthorised;
  }

  const key = row.video_file;
  const range = request.headers.get('Range');

  if (range) {
    const head = await env.MEDIA.head(key);
    if (!head) return new Response(null, { status: 404 });
    const size = head.size;
    const m = /bytes=(\d*)-(\d*)/.exec(range) || [];
    let start = m[1] ? Number(m[1]) : 0;
    let end = m[2] ? Number(m[2]) : size - 1;
    if (Number.isNaN(start)) start = 0;
    if (Number.isNaN(end) || end >= size) end = size - 1;
    if (start >= size || start > end) {
      return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${size}` } });
    }
    const obj = await env.MEDIA.get(key, { range: { offset: start, length: end - start + 1 } });
    if (!obj) return new Response(null, { status: 404 });
    return new Response(obj.body, {
      status: 206,
      headers: {
        'Content-Type': head.httpMetadata?.contentType || 'video/mp4',
        'Content-Range': `bytes ${start}-${end}/${size}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': String(end - start + 1),
        'Cache-Control': 'private, max-age=0',
      },
    });
  }

  const obj = await env.MEDIA.get(key);
  if (!obj) return new Response(null, { status: 404 });
  return new Response(obj.body, {
    status: 200,
    headers: {
      'Content-Type': obj.httpMetadata?.contentType || 'video/mp4',
      'Accept-Ranges': 'bytes',
      'Content-Length': String(obj.size),
      'Cache-Control': 'private, max-age=0',
    },
  });
}
