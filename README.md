# Gujarat PG Org

A website for **PG & hostel residents across Gujarat** to share their stories after
sudden shutdowns and evictions. Residents submit their name, phone, city, PG name,
the problems they face, what they want, their story, and an optional **video**
(uploaded file or a link). Everything is saved to a database you can **export to
one Excel sheet** with a single click.

Built to be shared with the news and marketed nationwide.

---

## What's inside

| Page | URL | Who it's for |
|------|-----|--------------|
| Landing + story form | `/` | The public (bilingual English / हिंदी) |
| Wall of Stories | `/#stories` | The public — approved stories only |
| Admin dashboard | `/admin` | You — review, approve, export |

- **Privacy by design:** phone numbers and emails are **never** shown publicly.
- **Moderation:** a story appears on the public wall only after *you* approve it
  **and** the person ticked the "show publicly" consent box.
- **Video:** residents can upload a clip (up to 60 MB) *or* paste a YouTube /
  Instagram / Drive link.

---

## Run it locally (on your Mac)

```bash
cd /Volumes/TESLA/ghar-bachao
cp .env.example .env        # then open .env and set a strong ADMIN_PASSWORD
npm install                 # first time only
npm start
```

Open **http://localhost:3000** for the site and **http://localhost:3000/admin**
for the dashboard. The admin login is:

- Username: *(leave blank / anything)*
- Password: the `ADMIN_PASSWORD` from your `.env`

Data is stored in `data/stories.db` and uploaded videos in `uploads/`.
Both folders are created automatically and are **not** committed to git.

---

## Put it online

**Production runs on Cloudflare Pages** (deployed from the GitHub repo) with the
API as Pages Functions, **D1** for the stories database, and **R2** for uploaded
videos — $0 to start, data persists, custom domain on `gujaratpg.org`.

👉 **Full step-by-step: [`DEPLOY-CLOUDFLARE.md`](DEPLOY-CLOUDFLARE.md)** (create
D1 + R2, connect the repo, set `ADMIN_PASSWORD`, point the domain).

The Cloudflare backend lives in `functions/` (`schema.sql` + `wrangler.toml`
configure D1/R2). `server.js` / `db.js` are the **legacy local Node/Express**
version — handy for offline dev (`npm start`), not used in production.

> **Before going public:** set a strong `ADMIN_PASSWORD` secret, confirm HTTPS is
> on (automatic on Pages), and decide your data-retention/consent policy since
> you're collecting personal stories.

---

## Get your Excel sheet

Log in to `/admin` and click **⬇ Export to Excel**. You get
`gujarat-pg-org-YYYY-MM-DD.xlsx` with every submission — name, phone, email, city,
PG, problems, story, what they want, video references, consent, and status.

---

## Tech

Node + Express · SQLite (`better-sqlite3`) · Multer (video upload) ·
ExcelJS (export) · Helmet + rate limiting. No build step, no framework —
`node server.js` and it runs.

## Name & domains

The public name is **Gujarat PG Org**. Primary domain **`gujaratpg.org`**
(`.in` and `.com` are also available — worth registering to lock down the brand).
To rename again, edit the brand text in `public/index.html` (the `.brand-hi` /
`.brand-en` spans + `<title>`), the footer, and `public/admin.html`.
