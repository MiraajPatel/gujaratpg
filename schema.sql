-- Gujarat PG Org — Cloudflare D1 schema.
-- Apply with:  wrangler d1 execute gujaratpg --file=./schema.sql   (add --remote for prod)

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
  video_file     TEXT,          -- R2 object key
  video_link     TEXT,          -- external URL (YouTube / Drive / IG)
  consent_public INTEGER DEFAULT 0,
  status         TEXT DEFAULT 'pending',   -- pending | approved | hidden
  ip             TEXT,
  user_agent     TEXT
);

CREATE INDEX IF NOT EXISTS idx_status  ON submissions (status);
CREATE INDEX IF NOT EXISTS idx_created ON submissions (created_at);
CREATE INDEX IF NOT EXISTS idx_ip      ON submissions (ip);
