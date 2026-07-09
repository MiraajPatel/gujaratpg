'use strict';

/* Admin dashboard. Runs behind HTTP Basic auth; the browser re-sends the
   cached credentials on every fetch to /api/admin/* and /media/*. */

let ALL = [];
let FILTER = 'all';

const PROB_LABEL = {
  eviction: 'Eviction', homeless: 'Homeless', short_notice: 'No notice',
  no_alternative: 'No alternative', studies: 'Studies hit', job: 'Work hit',
  financial: 'Financial loss', deposit_lost: 'Deposit lost', safety: 'Safety',
  health: 'Health', other: 'Other',
};

function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
}

function kv(label, value) {
  const dt = el('dt', null, label);
  const dd = el('dd', null, value || '—');
  return [dt, dd];
}

async function load() {
  try {
    const res = await fetch('/api/admin/stories', { headers: { 'Cache-Control': 'no-cache' } });
    if (res.status === 401) { document.getElementById('list').innerHTML = '<p class="empty">Not authorised. Refresh and enter the admin password.</p>'; return; }
    const j = await res.json();
    ALL = j.stories || [];
    renderStats(j.stats);
    render();
  } catch (e) {
    document.getElementById('list').innerHTML = '<p class="empty">Could not load. Is the server running?</p>';
  }
}

function renderStats(s) {
  const box = document.getElementById('stats');
  if (!s) { box.innerHTML = ''; return; }
  box.innerHTML = '';
  [['Total', s.total], ['Pending', s.pending], ['Approved', s.approved], ['Cities', s.cities]].forEach(([label, n]) => {
    const stat = el('div', 'stat');
    stat.appendChild(el('b', null, String(n)));
    stat.appendChild(el('span', null, label));
    box.appendChild(stat);
  });
}

function render() {
  const list = document.getElementById('list');
  list.innerHTML = '';
  const rows = ALL.filter((r) => FILTER === 'all' || r.status === FILTER);
  if (!rows.length) { list.innerHTML = '<p class="empty">No submissions in this view yet.</p>'; return; }
  rows.forEach((r) => list.appendChild(card(r)));
}

function card(r) {
  const c = el('article', 'card');
  c.dataset.id = r.id;

  const top = el('div', 'card-top');
  top.appendChild(el('span', 'name', r.full_name));
  const when = new Date(r.created_at).toLocaleString();
  top.appendChild(el('span', 'meta', `${r.city}${r.state ? ', ' + r.state : ''} · ${when}`));
  top.appendChild(el('span', 'badge ' + r.status, r.status));
  c.appendChild(top);

  const dl = el('dl', 'kv');
  dl.append(...kv('Phone', r.phone));
  dl.append(...kv('Email', r.email));
  dl.append(...kv('PG / Hostel', `${r.pg_name}${r.pg_area ? ' — ' + r.pg_area : ''}`));
  dl.append(...kv('Resident', r.resident_type));
  dl.append(...kv('Stayed', r.duration));
  dl.append(...kv('Wants', r.what_they_want));
  c.appendChild(dl);

  if (Array.isArray(r.problems) && r.problems.length) {
    const tags = el('div', 'tags');
    r.problems.forEach((p) => tags.appendChild(el('span', 'tag', PROB_LABEL[p] || p)));
    c.appendChild(tags);
  }

  c.appendChild(el('div', 'story-text', r.story));

  if (r.video_file) {
    const v = document.createElement('video');
    v.controls = true; v.preload = 'metadata';
    v.src = `/media/${encodeURIComponent(r.id)}`;
    c.appendChild(v);
  }

  const actions = el('div', 'actions');
  const consent = el('span', 'consent-flag ' + (r.consent_public ? 'consent-yes' : 'consent-no'),
    r.consent_public ? '✓ Public consent given' : '✗ No public consent');
  actions.appendChild(consent);

  const mk = (label, cls, status) => {
    const b = el('button', 'btn ' + cls, label);
    b.addEventListener('click', () => setStatus(r.id, status, b));
    return b;
  };
  if (r.status !== 'approved') actions.appendChild(mk('Approve for wall', 'btn-approve', 'approved'));
  if (r.status !== 'hidden') actions.appendChild(mk('Hide', 'btn-hide', 'hidden'));
  if (r.status !== 'pending') actions.appendChild(mk('Mark pending', 'btn-pending', 'pending'));

  if (r.video_link) {
    const a = el('a', 'media', '▶ External video link');
    a.href = r.video_link; a.target = '_blank'; a.rel = 'noopener noreferrer';
    actions.appendChild(a);
  }
  c.appendChild(actions);
  return c;
}

async function setStatus(id, status, btn) {
  const prev = btn.textContent;
  btn.textContent = '…';
  try {
    const res = await fetch(`/api/admin/stories/${encodeURIComponent(id)}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    const j = await res.json();
    if (j.ok) {
      const row = ALL.find((r) => r.id === id);
      if (row) row.status = status;
      load(); // refresh stats + list
    } else {
      btn.textContent = prev;
    }
  } catch {
    btn.textContent = prev;
  }
}

document.getElementById('filters').addEventListener('click', (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;
  FILTER = btn.dataset.filter;
  document.querySelectorAll('#filters button').forEach((b) => b.classList.toggle('active', b === btn));
  render();
});

load();
