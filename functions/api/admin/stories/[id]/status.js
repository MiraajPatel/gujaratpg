import { json, clean, requireAdmin } from '../../../../_shared.js';

const VALID = ['pending', 'approved', 'hidden'];

// Admin: change a submission's moderation status (password protected).
export async function onRequestPost({ request, env, params }) {
  const unauthorised = requireAdmin(request, env);
  if (unauthorised) return unauthorised;

  let body = {};
  try { body = await request.json(); } catch { body = {}; }
  const status = clean(body && body.status, 20);
  if (!VALID.includes(status)) return json({ ok: false, error: 'BAD_STATUS' }, 400);

  const res = await env.DB
    .prepare('UPDATE submissions SET status = ? WHERE id = ?')
    .bind(status, params.id)
    .run();
  const changed = !!(res && res.meta && res.meta.changes > 0);
  return json({ ok: changed });
}
