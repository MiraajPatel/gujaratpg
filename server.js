'use strict';

require('dotenv').config();

const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const ExcelJS = require('exceljs');
const { customAlphabet } = require('nanoid');

const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'changeme';
const MAX_VIDEO_MB = Number(process.env.MAX_VIDEO_MB || 60);

const UPLOAD_DIR = path.join(__dirname, 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const nanoid = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 12);

app.set('trust proxy', 1);

/* ----------------------------------------------------------------------------
 * Security & parsing middleware
 * ------------------------------------------------------------------------- */
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        'default-src': ["'self'"],
        'script-src': ["'self'"],
        'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        'font-src': ["'self'", 'https://fonts.gstatic.com'],
        'img-src': ["'self'", 'data:'],
        'media-src': ["'self'", 'blob:'],
        'connect-src': ["'self'"],
        'frame-ancestors': ["'self'"],
        'object-src': ["'none'"],
        'base-uri': ["'self'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// JSON API responses must never be cached — the public wall and stats have to
// reflect admin approve/hide actions immediately.
app.use('/api', (_req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

/* ----------------------------------------------------------------------------
 * File uploads (video)
 * ------------------------------------------------------------------------- */
const ALLOWED_VIDEO = new Set([
  'video/mp4',
  'video/quicktime',
  'video/webm',
  'video/x-matroska',
  'video/3gpp',
  'video/x-msvideo',
]);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = (path.extname(file.originalname || '') || '.mp4').slice(0, 12);
    cb(null, `${Date.now()}-${nanoid()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_VIDEO_MB * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_VIDEO.has(file.mimetype)) return cb(null, true);
    cb(new Error('UNSUPPORTED_VIDEO_TYPE'));
  },
});

/* ----------------------------------------------------------------------------
 * Helpers
 * ------------------------------------------------------------------------- */
function clean(value, max = 5000) {
  if (value == null) return '';
  return String(value).replace(/\s+$/g, '').trim().slice(0, max);
}

function normalizePhone(raw) {
  const digits = String(raw || '').replace(/\D/g, '');
  let ten = digits;
  if (ten.length === 12 && ten.startsWith('91')) ten = ten.slice(2);
  else if (ten.length === 11 && ten.startsWith('0')) ten = ten.slice(1);
  return /^[6-9]\d{9}$/.test(ten) ? ten : null;
}

const KNOWN_PROBLEMS = new Set([
  'eviction',
  'homeless',
  'financial',
  'studies',
  'job',
  'safety',
  'health',
  'no_alternative',
  'short_notice',
  'deposit_lost',
  'other',
]);

function parseProblems(input) {
  let arr = [];
  if (Array.isArray(input)) arr = input;
  else if (typeof input === 'string' && input) arr = input.split(',');
  const tags = arr.map((s) => clean(s, 40)).filter((s) => KNOWN_PROBLEMS.has(s));
  return [...new Set(tags)];
}

function timingSafeEqual(a, b) {
  const ba = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

/* Basic-auth guard for admin routes. */
function requireAdmin(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, encoded] = header.split(' ');
  if (scheme === 'Basic' && encoded) {
    const decoded = Buffer.from(encoded, 'base64').toString('utf8');
    const idx = decoded.indexOf(':');
    const pass = idx >= 0 ? decoded.slice(idx + 1) : decoded;
    if (timingSafeEqual(pass, ADMIN_PASSWORD)) return next();
  }
  res.set('WWW-Authenticate', 'Basic realm="Ghar Bachao Admin", charset="UTF-8"');
  return res.status(401).send('Authentication required.');
}

/* Stream a video file with HTTP range support (needed for <video> seeking). */
function streamVideo(req, res, filename) {
  const filePath = path.join(UPLOAD_DIR, path.basename(filename));
  if (!fs.existsSync(filePath)) return res.status(404).end();

  const stat = fs.statSync(filePath);
  const range = req.headers.range;
  const type = 'video/mp4';

  if (!range) {
    res.writeHead(200, { 'Content-Length': stat.size, 'Content-Type': type });
    return fs.createReadStream(filePath).pipe(res);
  }
  const match = /bytes=(\d*)-(\d*)/.exec(range) || [];
  const start = Number(match[1] || 0);
  const end = match[2] ? Number(match[2]) : stat.size - 1;
  if (start >= stat.size || end >= stat.size) {
    res.writeHead(416, { 'Content-Range': `bytes */${stat.size}` });
    return res.end();
  }
  res.writeHead(206, {
    'Content-Range': `bytes ${start}-${end}/${stat.size}`,
    'Accept-Ranges': 'bytes',
    'Content-Length': end - start + 1,
    'Content-Type': type,
  });
  return fs.createReadStream(filePath, { start, end }).pipe(res);
}

/* ----------------------------------------------------------------------------
 * Rate limiting on submissions
 * ------------------------------------------------------------------------- */
const submitLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, error: 'RATE_LIMITED' },
});

/* ----------------------------------------------------------------------------
 * Public API
 * ------------------------------------------------------------------------- */

// Submit a story (with optional video file).
app.post('/api/stories', submitLimiter, (req, res) => {
  upload.single('video')(req, res, (err) => {
    if (err) {
      const code = err.code === 'LIMIT_FILE_SIZE' ? 'VIDEO_TOO_LARGE' : err.message;
      return res.status(400).json({ ok: false, error: code });
    }

    try {
      const b = req.body || {};

      // Honeypot: bots fill hidden "website" field. Pretend success, store nothing.
      if (clean(b.website, 200)) {
        if (req.file) fs.unlink(path.join(UPLOAD_DIR, req.file.filename), () => {});
        return res.json({ ok: true, id: 'skipped' });
      }

      const full_name = clean(b.full_name, 120);
      const phone = normalizePhone(b.phone);
      const city = clean(b.city, 80);
      const pg_name = clean(b.pg_name, 160);
      const story = clean(b.story, 8000);

      const missing = [];
      if (!full_name) missing.push('full_name');
      if (!phone) missing.push('phone');
      if (!city) missing.push('city');
      if (!pg_name) missing.push('pg_name');
      if (story.length < 20) missing.push('story');
      if (missing.length) {
        if (req.file) fs.unlink(path.join(UPLOAD_DIR, req.file.filename), () => {});
        return res.status(400).json({ ok: false, error: 'VALIDATION', fields: missing });
      }

      let video_link = clean(b.video_link, 500);
      if (video_link && !/^https?:\/\//i.test(video_link)) video_link = '';

      const row = {
        id: nanoid(),
        created_at: new Date().toISOString(),
        full_name,
        phone,
        email: clean(b.email, 160),
        city,
        state: clean(b.state, 80),
        pg_name,
        pg_area: clean(b.pg_area, 160),
        resident_type: clean(b.resident_type, 40),
        duration: clean(b.duration, 60),
        problems: JSON.stringify(parseProblems(b.problems)),
        story,
        what_they_want: clean(b.what_they_want, 4000),
        video_file: req.file ? req.file.filename : null,
        video_link: video_link || null,
        consent_public: b.consent_public === 'true' || b.consent_public === 'on' || b.consent_public === '1' ? 1 : 0,
        status: 'pending',
        ip: (req.ip || '').slice(0, 60),
        user_agent: clean(req.headers['user-agent'], 300),
      };

      db.insertSubmission(row);
      return res.json({ ok: true, id: row.id });
    } catch (e) {
      console.error('submit error:', e);
      if (req.file) fs.unlink(path.join(UPLOAD_DIR, req.file.filename), () => {});
      return res.status(500).json({ ok: false, error: 'SERVER_ERROR' });
    }
  });
});

// Public wall: only approved + consented stories. Never exposes phone/email.
app.get('/api/stories/public', (req, res) => {
  const rows = db.getPublicApproved(60).map((r) => ({
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
  res.json({ ok: true, stories: rows });
});

// Public counters for the impact strip.
app.get('/api/stats', (_req, res) => {
  const s = db.getStats();
  res.json({ ok: true, total: s.total, approved: s.approved, cities: s.cities });
});

// Serve a video. Public only if the story is approved + consented; else admin.
app.get('/media/:id', (req, res) => {
  const row = db.getById(req.params.id);
  if (!row || !row.video_file) return res.status(404).end();

  const isPublic = row.status === 'approved' && row.consent_public === 1;
  if (isPublic) return streamVideo(req, res, row.video_file);
  return requireAdmin(req, res, () => streamVideo(req, res, row.video_file));
});

/* ----------------------------------------------------------------------------
 * Admin API (password protected)
 * ------------------------------------------------------------------------- */
app.get('/api/admin/stories', requireAdmin, (_req, res) => {
  const rows = db.getAll().map((r) => ({ ...r, problems: safeParse(r.problems) }));
  res.json({ ok: true, stats: db.getStats(), stories: rows });
});

app.post('/api/admin/stories/:id/status', requireAdmin, (req, res) => {
  const status = clean(req.body && req.body.status, 20);
  if (!['pending', 'approved', 'hidden'].includes(status)) {
    return res.status(400).json({ ok: false, error: 'BAD_STATUS' });
  }
  const changed = db.setStatus(req.params.id, status);
  res.json({ ok: changed });
});

// Download everything as an Excel workbook.
app.get('/admin/export.xlsx', requireAdmin, async (_req, res) => {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Ghar Bachao';
  const ws = wb.addWorksheet('Submissions');

  ws.columns = [
    { header: 'ID', key: 'id', width: 16 },
    { header: 'Submitted (UTC)', key: 'created_at', width: 22 },
    { header: 'Name', key: 'full_name', width: 22 },
    { header: 'Phone', key: 'phone', width: 15 },
    { header: 'Email', key: 'email', width: 24 },
    { header: 'City', key: 'city', width: 16 },
    { header: 'State', key: 'state', width: 16 },
    { header: 'PG / Hostel Name', key: 'pg_name', width: 26 },
    { header: 'Area', key: 'pg_area', width: 20 },
    { header: 'Resident Type', key: 'resident_type', width: 16 },
    { header: 'Duration Stayed', key: 'duration', width: 16 },
    { header: 'Problems', key: 'problems', width: 34 },
    { header: 'Story', key: 'story', width: 70 },
    { header: 'What They Want', key: 'what_they_want', width: 50 },
    { header: 'Video File', key: 'video_file', width: 30 },
    { header: 'Video Link', key: 'video_link', width: 34 },
    { header: 'Public Consent', key: 'consent_public', width: 14 },
    { header: 'Status', key: 'status', width: 12 },
  ];
  ws.getRow(1).font = { bold: true };
  ws.getRow(1).alignment = { vertical: 'middle' };
  ws.views = [{ state: 'frozen', ySplit: 1 }];

  for (const r of db.getAll()) {
    ws.addRow({
      ...r,
      problems: safeParse(r.problems).join(', '),
      consent_public: r.consent_public ? 'YES' : 'no',
    });
  }
  ws.eachRow((row) => (row.alignment = { vertical: 'top', wrapText: true }));

  const stamp = new Date().toISOString().slice(0, 10);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="ghar-bachao-${stamp}.xlsx"`);
  await wb.xlsx.write(res);
  res.end();
});

/* ----------------------------------------------------------------------------
 * Static & pages
 * ------------------------------------------------------------------------- */
app.get('/admin', requireAdmin, (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.use(express.static(path.join(__dirname, 'public'), { extensions: ['html'] }));

app.use((_req, res) => res.status(404).sendFile(path.join(__dirname, 'public', 'index.html')));

function safeParse(json) {
  try {
    const v = JSON.parse(json);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

app.listen(PORT, () => {
  console.log(`\n  Ghar Bachao running → http://localhost:${PORT}`);
  console.log(`  Admin dashboard     → http://localhost:${PORT}/admin`);
  if (ADMIN_PASSWORD === 'changeme') {
    console.warn('  ⚠  ADMIN_PASSWORD is the default "changeme" — set it in .env before going live.\n');
  }
});
