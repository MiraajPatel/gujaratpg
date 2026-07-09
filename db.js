'use strict';

/**
 * SQLite data layer for Gujarat PG Org.
 * One table: `submissions`. Synchronous better-sqlite3 keeps this simple and
 * safe against the concurrent writes a public campaign form will receive.
 */

const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const DATA_DIR = path.join(__dirname, 'data');
fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new Database(path.join(DATA_DIR, 'stories.db'));
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS submissions (
    id             TEXT PRIMARY KEY,
    created_at     TEXT NOT NULL,
    full_name      TEXT NOT NULL,
    phone          TEXT NOT NULL,
    email          TEXT,
    city           TEXT NOT NULL,
    state          TEXT,
    pg_name        TEXT NOT NULL,
    pg_area        TEXT,
    resident_type  TEXT,
    duration       TEXT,
    problems       TEXT,          -- JSON array of problem tags
    story          TEXT NOT NULL,
    what_they_want TEXT,
    video_file     TEXT,          -- stored filename in /uploads
    video_link     TEXT,          -- external URL (YouTube / Drive / IG)
    consent_public INTEGER DEFAULT 0,
    status         TEXT DEFAULT 'pending',   -- pending | approved | hidden
    ip             TEXT,
    user_agent     TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_status  ON submissions (status);
  CREATE INDEX IF NOT EXISTS idx_created ON submissions (created_at);
`);

const stmts = {
  insert: db.prepare(`
    INSERT INTO submissions (
      id, created_at, full_name, phone, email, city, state, pg_name, pg_area,
      resident_type, duration, problems, story, what_they_want,
      video_file, video_link, consent_public, status, ip, user_agent
    ) VALUES (
      @id, @created_at, @full_name, @phone, @email, @city, @state, @pg_name, @pg_area,
      @resident_type, @duration, @problems, @story, @what_they_want,
      @video_file, @video_link, @consent_public, @status, @ip, @user_agent
    )
  `),
  byId: db.prepare(`SELECT * FROM submissions WHERE id = ?`),
  all: db.prepare(`SELECT * FROM submissions ORDER BY created_at DESC`),
  publicApproved: db.prepare(`
    SELECT id, created_at, full_name, city, state, pg_name, resident_type,
           problems, story, what_they_want, video_file, video_link
    FROM submissions
    WHERE status = 'approved' AND consent_public = 1
    ORDER BY created_at DESC
    LIMIT ?
  `),
  setStatus: db.prepare(`UPDATE submissions SET status = ? WHERE id = ?`),
  counts: db.prepare(`
    SELECT
      COUNT(*)                                            AS total,
      SUM(CASE WHEN status = 'pending'  THEN 1 ELSE 0 END) AS pending,
      SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) AS approved,
      SUM(CASE WHEN status = 'hidden'   THEN 1 ELSE 0 END) AS hidden
    FROM submissions
  `),
  distinctCities: db.prepare(`SELECT COUNT(DISTINCT city) AS n FROM submissions`),
};

module.exports = {
  insertSubmission(row) {
    stmts.insert.run(row);
    return row.id;
  },
  getById(id) {
    return stmts.byId.get(id);
  },
  getAll() {
    return stmts.all.all();
  },
  getPublicApproved(limit = 60) {
    return stmts.publicApproved.all(limit);
  },
  setStatus(id, status) {
    const info = stmts.setStatus.run(status, id);
    return info.changes > 0;
  },
  getStats() {
    const c = stmts.counts.get();
    const cities = stmts.distinctCities.get();
    return {
      total: c.total || 0,
      pending: c.pending || 0,
      approved: c.approved || 0,
      hidden: c.hidden || 0,
      cities: cities.n || 0,
    };
  },
};
