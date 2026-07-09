# Deploy Gujarat PG Org to Cloudflare Pages (Functions + D1 + R2)

This is the **production** path — a fully working site on Cloudflare, deployed
from the GitHub repo, $0 to start, with data that persists.

- **Static site** (`public/`) → served by Cloudflare Pages
- **API** (`functions/`) → Cloudflare Pages Functions
- **Stories database** → Cloudflare **D1** (SQLite), binding `DB`
- **Uploaded videos** → Cloudflare **R2**, binding `MEDIA`
- **Admin password** → a Pages **secret** `ADMIN_PASSWORD`

Repo: `github.com/MiraajPatel/gujaratpg` · Primary domain: `gujaratpg.org`

---

## One-time setup

You need the Wrangler CLI and a Cloudflare account:

```bash
npm install -g wrangler
wrangler login
```

### 1. Create the D1 database

```bash
wrangler d1 create gujaratpg
```

Copy the printed `database_id` into **`wrangler.toml`** (replace
`REPLACE_WITH_YOUR_D1_DATABASE_ID`), then create the table **on the remote DB**:

```bash
wrangler d1 execute gujaratpg --remote --file=./schema.sql
```

### 2. Create the R2 bucket (for uploaded videos)

```bash
wrangler r2 bucket create gujaratpg-media
```

(The bucket name `gujaratpg-media` already matches `wrangler.toml`.)

### 3. Create the Pages project from GitHub

Cloudflare dashboard → **Workers & Pages → Create → Pages → Connect to Git** →
pick **`MiraajPatel/gujaratpg`**. Build settings:

| Setting | Value |
|---|---|
| Framework preset | **None** |
| Build command | *(leave empty)* |
| Build output directory | **`public`** |

Deploy once. Pages auto-detects `functions/`.

### 4. Bindings + set the admin password

Once `database_id` is filled in (step 1), **`wrangler.toml` already declares the
`DB` and `MEDIA` bindings** — Pages reads it, so you don't need to add them in the
dashboard. (If you'd rather not use `wrangler.toml`, set them under **Settings →
Functions → Bindings** instead: `DB` → `gujaratpg`, `MEDIA` → `gujaratpg-media`.)

Set the admin password as an **encrypted secret** (never a plain var / never in
`wrangler.toml`):

```bash
wrangler pages secret put ADMIN_PASSWORD --project-name gujaratpg
# paste a strong password when prompted
```

(Optional: plain var `MAX_VIDEO_MB` = `60` under Settings → Environment variables.)

Trigger a redeploy so the bindings take effect (Deployments → Retry, or push a commit).

### 5. Point the domain

Pages project → **Custom domains → Set up a custom domain** → `gujaratpg.org`
(and `www`). Because the domain's DNS is on Cloudflare, records + HTTPS are added
automatically. `.in` / `.com` can 301-redirect to `.org` via a Cloudflare Bulk
Redirect if you register them.

---

## Verify it's live

- `/` — landing + story form (submit a test story)
- `/#stories` — public wall (empty until you approve something)
- `/admin` — enter the `ADMIN_PASSWORD` when the browser prompts → approve your
  test story → it appears on the wall
- **⬇ Export to Excel (CSV)** on `/admin` downloads `gujarat-pg-org-<date>.csv`

---

## Local development (optional)

```bash
echo 'ADMIN_PASSWORD = "localpass"' > .dev.vars          # gitignored
wrangler d1 execute gujaratpg --local --file=./schema.sql # seed local DB once
wrangler pages dev public                                 # http://localhost:8788
```

Local mode uses on-disk simulations of D1 + R2 (no account needed). `.dev.vars`
and `.wrangler/` are gitignored.

---

## Live Google Sheet (auto-updating spreadsheet)

Every submission also appends a row to a Google Sheet in real time, so you have a
living spreadsheet (open it, sort/filter, download as `.xlsx` anytime). Setup:

1. Google Sheet -> Extensions -> Apps Script -> paste [`docs/google-sheet-webhook.gs`](docs/google-sheet-webhook.gs), set `TOKEN`.
2. Deploy -> New deployment -> **Web app** -> Execute as **Me**, Who has access **Anyone** -> copy the `/exec` URL.
3. In the Pages project add two **secrets**: `SHEETS_WEBHOOK_URL` (the `/exec` URL) and `SHEETS_TOKEN` (same as `TOKEN`), then redeploy.

`functions/api/stories.js` fires the webhook via `waitUntil` (fire-and-forget) — a
slow or unreachable sheet never delays or fails a resident's submission. If the
secrets are unset, it simply no-ops.

## Notes / decisions

- **Excel export is CSV.** The old Node app used ExcelJS, which doesn't run on
  the Workers runtime. A UTF-8 CSV (with BOM) opens as one sheet in Excel /
  Sheets and preserves Hindi text — same columns, same data.
- **Rate limiting:** submissions are capped at 8 per IP per hour (in
  `functions/api/stories.js`). For stronger protection, add a Cloudflare WAF
  rate-limiting rule in the dashboard.
- **Free tier headroom:** D1 (5 GB), R2 (10 GB), Pages Functions (100k req/day)
  are plenty for launch. Videos are the main cost driver — encourage the "paste
  a link" option for large clips.
- `server.js` / `db.js` are the **legacy local Node/Express** version (SQLite on
  disk). They still run with `npm start` for offline dev, but the deployed site
  is the Cloudflare Functions above.
