import { json, safeParse, requireAdmin } from '../../_shared.js';

// Admin: full list + stats (password protected).
export async function onRequestGet({ request, env }) {
  const unauthorised = requireAdmin(request, env);
  if (unauthorised) return unauthorised;

  const { results } = await env.DB
    .prepare('SELECT * FROM submissions ORDER BY created_at DESC')
    .all();
  const stories = (results || []).map((r) => ({ ...r, problems: safeParse(r.problems) }));

  const c = await env.DB.prepare(
    `SELECT
       COUNT(*)                                             AS total,
       SUM(CASE WHEN status = 'pending'  THEN 1 ELSE 0 END) AS pending,
       SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) AS approved,
       SUM(CASE WHEN status = 'hidden'   THEN 1 ELSE 0 END) AS hidden
     FROM submissions`,
  ).first();
  const cc = await env.DB.prepare('SELECT COUNT(DISTINCT city) AS n FROM submissions').first();

  const stats = {
    total: c?.total || 0,
    pending: c?.pending || 0,
    approved: c?.approved || 0,
    hidden: c?.hidden || 0,
    cities: cc?.n || 0,
  };
  return json({ ok: true, stats, stories });
}
