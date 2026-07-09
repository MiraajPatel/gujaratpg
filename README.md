# घर बचाओ · Ghar Bachao

A website for **PG & hostel residents across India** to share their stories after
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

This is a standard Node app, so any host that runs Node + gives you a persistent
disk works. Easiest options:

### Option A — Render.com / Railway.app (recommended, has free tier)
1. Push this folder to a GitHub repo.
2. Create a new **Web Service** from that repo.
3. Build command: `npm install` · Start command: `npm start`.
4. Add a **persistent disk** (e.g. mounted at the project folder) so `data/` and
   `uploads/` survive restarts.
5. Set environment variables: `ADMIN_PASSWORD` (strong password) and
   `MAX_VIDEO_MB` (optional).
6. Point your domain (e.g. `gharbachao.in`) at it.

### Option B — a VPS (DigitalOcean, Hetzner, etc.)
1. Install Node 18+.
2. Copy the folder up, run `npm install`, set `.env`.
3. Run with a process manager: `pm2 start server.js --name ghar-bachao`.
4. Put Nginx in front for HTTPS (Let's Encrypt).

> **Before going public:** set a real `ADMIN_PASSWORD`, serve over **HTTPS**, and
> consider your data-retention/consent policy since you're collecting personal
> stories.

---

## Get your Excel sheet

Log in to `/admin` and click **⬇ Export to Excel**. You get
`ghar-bachao-YYYY-MM-DD.xlsx` with every submission — name, phone, email, city,
PG, problems, story, what they want, video references, consent, and status.

---

## Tech

Node + Express · SQLite (`better-sqlite3`) · Multer (video upload) ·
ExcelJS (export) · Helmet + rate limiting. No build step, no framework —
`node server.js` and it runs.

## Rename the movement

The working name is **Ghar Bachao**. To change it, edit the brand text in
`public/index.html` (search for `घर बचाओ` / `Ghar Bachao`) and the footer.
