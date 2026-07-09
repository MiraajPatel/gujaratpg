import { json, safeParse } from '../../_shared.js';

// Public wall: only approved + consented stories. Never exposes phone/email.
export async function onRequestGet({ env }) {
  try {
    const { results } = await env.DB.prepare(
      `SELECT id, created_at, full_name, city, state, pg_name, resident_type,
              problems, story, what_they_want, video_file, video_link
       FROM submissions
       WHERE status = 'approved' AND consent_public = 1
       ORDER BY created_at DESC
       LIMIT 60`,
    ).all();

    const stories = (results || []).map((r) => ({
      id: r.id,
      created_at: r.created_at,
      first_name: (r.full_name || '').split(/\s+/)[0],
      city: r.city,
      state: r.state,
      pg_name: r.pg_name,
      resident_type: r.resident_type,
      problems: safeParse(r.problems),
      story: r.story,
      what_they_want: r.what_they_want,
      has_video: !!r.video_file,
      video_link: r.video_link,
    }));
    return json({ ok: true, stories });
  } catch {
    return json({ ok: true, stories: [] });
  }
}
