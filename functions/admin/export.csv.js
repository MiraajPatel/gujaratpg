import { requireAdmin, safeParse } from '../_shared.js';

// Column order matches the old Excel export. CSV (UTF-8 BOM) opens as one sheet
// in Excel / Google Sheets and preserves Hindi text.
const COLUMNS = [
  ['id', 'ID'],
  ['created_at', 'Submitted (UTC)'],
  ['full_name', 'Name'],
  ['phone', 'Phone'],
  ['email', 'Email'],
  ['city', 'City'],
  ['state', 'State'],
  ['pg_name', 'PG / Hostel Name'],
  ['pg_area', 'Area'],
  ['resident_type', 'Resident Type'],
  ['duration', 'Duration Stayed'],
  ['problems', 'Problems'],
  ['story', 'Story'],
  ['what_they_want', 'What They Want'],
  ['video_file', 'Video File'],
  ['video_link', 'Video Link'],
  ['consent_public', 'Public Consent'],
  ['status', 'Status'],
];

function csvCell(value) {
  const s = value == null ? '' : String(value);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function onRequestGet({ request, env }) {
  const unauthorised = requireAdmin(request, env);
  if (unauthorised) return unauthorised;

  const { results } = await env.DB
    .prepare('SELECT * FROM submissions ORDER BY created_at DESC')
    .all();

  const lines = [COLUMNS.map(([, header]) => csvCell(header)).join(',')];
  for (const r of results || []) {
    const rowObj = {
      ...r,
      problems: safeParse(r.problems).join(', '),
      consent_public: r.consent_public ? 'YES' : 'no',
    };
    lines.push(COLUMNS.map(([key]) => csvCell(rowObj[key])).join(','));
  }

  const stamp = new Date().toISOString().slice(0, 10);
  const body = '﻿' + lines.join('\r\n'); // BOM so Excel reads Unicode (Hindi) correctly
  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="gujarat-pg-org-${stamp}.csv"`,
      'Cache-Control': 'no-store',
    },
  });
}
