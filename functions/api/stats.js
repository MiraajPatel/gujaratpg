import { json } from '../_shared.js';

// Public counters for the impact strip.
export async function onRequestGet({ env }) {
  try {
    const c = await env.DB.prepare(
      `SELECT
         COUNT(*)                                             AS total,
         SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) AS approved
       FROM submissions`,
    ).first();
    const cc = await env.DB.prepare('SELECT COUNT(DISTINCT city) AS n FROM submissions').first();
    return json({ ok: true, total: c?.total || 0, approved: c?.approved || 0, cities: cc?.n || 0 });
  } catch {
    return json({ ok: true, total: 0, approved: 0, cities: 0 });
  }
}
