# BizBranches - cPanel Single-Domain Deployment Guide

## Architecture (Static Export – No Node.js)

The frontend is built as a **static export** (HTML/CSS/JS). cPanel serves these files with Apache; **no Node.js app** is required.

```
bizbranches.pk/     → Static HTML/JS (Apache)
bizbranches.pk/api/* → PHP backend (Apache)
```

Apache serves static files from the domain root and routes `/api/*` to PHP.

### Directory on cPanel

```
public_html/
├── .htaccess          ← Routes /api/* to PHP, serves static files otherwise
├── index.html         ← Home page (from Next.js static export)
├── _next/             ← JS/CSS bundles
├── category/          ← Category pages (static)
├── city/              ← City pages (static)
├── *.html             ← Other static pages
├── public/            ← Images, manifest, robots.txt (if copied)
└── api/               ← PHP backend (upload manually)
    ├── .htaccess
    ├── .env            ← Create manually!
    ├── index.php
    ├── config/, lib/, routes/, migrations/, scripts/, vendor/
```

---

## Step 1: Initial cPanel Setup

### 1.1 Create MySQL Database

1. **cPanel > MySQL Databases**
2. Create database: `bizbranches` → becomes `bizbranchespk_bizbranches`
3. Create user: `bizuser` → becomes `bizbranchespk_bizuser`
4. Add user to database with **ALL PRIVILEGES**
5. **phpMyAdmin** → select database → **Import** tab → upload `backend-php/migrations/001_create_tables.sql`

### 1.2 No Node.js required

The frontend is a **static export**. Apache serves the built HTML/JS/CSS; you do **not** need to create a Node.js application in cPanel.

### 1.3 Create `.env` File for PHP Backend

Via **File Manager**, create `public_html/api/.env`:

```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=bizbranchespk_bizbranches
DB_USER=bizbranchespk_bizuser
DB_PASS=your_database_password

APP_ENV=production
ADMIN_SECRET=pick_a_secret_word

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

SMTP_HOST=mail.bizbranches.pk
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=support@bizbranches.pk
SMTP_PASS=your_email_password
EMAIL_FROM=support@bizbranches.pk
EMAIL_FROM_NAME=BizBranches Support
SUPPORT_EMAIL=support@bizbranches.pk

SITE_URL=https://bizbranches.pk
FRONTEND_URL=https://bizbranches.pk
NEXT_PUBLIC_SITE_URL=https://bizbranches.pk
```

---

## Step 2: Build on your machine

1. **Frontend env** — In `frontend/`, create `.env.local` (variables are documented in the repo root `.env.example`) with your live domain, for example:
   - `NEXT_PUBLIC_BACKEND_URL=https://bizbranches.pk`
   - `BACKEND_URL=https://bizbranches.pk`
   - `NEXT_PUBLIC_SITE_URL=https://bizbranches.pk`
   - `NEXT_PUBLIC_STATIC_EXPORT=true`
   - `NODE_ENV=production`  
   Add Cloudinary and any other keys your build needs.

2. **Install and build** from the **repository root**:
   ```bash
   npm run build
   ```

3. **Apache rules for static output** — After the build, copy the root file `cpanel-htaccess` to `frontend/out/.htaccess` (overwrite if needed).

4. **PHP dependencies**:
   ```bash
   cd backend-php
   composer install --no-dev --optimize-autoloader
   ```

---

## Step 3: Upload (zip or File Manager / FTP)

There is **no** GitHub Actions deploy; upload artifacts yourself.

1. **Frontend** — Upload the **contents** of `frontend/out/` into `public_html/` (same level as `index.html`, `_next/`, etc.). Keep your existing `public_html/api/` folder and its `.env`; do not delete the API when refreshing the site files.

2. **Backend** — Upload the **contents** of `backend-php/` (including `vendor/` from Composer) into `public_html/api/`. **Do not** replace a production `api/.env` with a template from the repo; edit `.env` only on the server if needed.

3. Optional: zip `frontend/out` and `backend-php` (with `vendor`) separately for cPanel **File Manager → Extract**, then move files into `public_html` and `public_html/api` as above.

---

## Step 4: Data

If migrating from another source, import data directly into MySQL via phpMyAdmin (SQL import, CSV, or custom scripts). The database schema is in `backend-php/migrations/001_create_tables.sql`.

---

## Step 5: Verify

1. Test frontend: `https://bizbranches.pk`
2. Test API: `https://bizbranches.pk/api/ping`
3. Test DB: `https://bizbranches.pk/api/db-health`

---

## SSL

1. **cPanel > SSL/TLS** or **Let's Encrypt**
2. Issue certificate for `bizbranches.pk`
3. Enable **Force HTTPS**

---

## Troubleshooting

### Manual deploy issues

1. **Blank or wrong site after upload** — Confirm `frontend/out/.htaccess` was copied from `cpanel-htaccess` before zipping/uploading.

2. **Build fails locally** — Fix errors from `npm run build` (missing `frontend/.env.local`, TypeScript, or network during build). The static export does not need the PHP server running for every page, but some builds may call the API; use the correct `BACKEND_URL` if required.

3. **API 500 after upload** — Run `composer install` on the copy you upload; check `public_html/api/.env` and file permissions.

---

### You see `{"ok":true,"message":"BizBranches API Server (PHP)"}` instead of the website

The domain document root is pointing at the **API folder** instead of the folder that contains the **static site** and `api/`:

1. **Set document root to the folder that has the static site**  
   In **cPanel > Domains** (or **Subdomains**), edit `bizbranches.pk` and set **Document Root** to the directory that contains **both** `index.html` and `.htaccess` (frontend) **and** the `api/` subfolder. Example: `public_html` — **not** `public_html/api`.

2. **Re-upload the static site**  
   Rebuild with `npm run build`, copy `cpanel-htaccess` → `frontend/out/.htaccess`, then upload `frontend/out/` contents to the correct document root (same folder that contains `api/`).

---

| Problem | Fix |
|---|---|
| `/api/*` returns 404 | Check `public_html/api/.htaccess` exists |
| API returns 500 | Check `public_html/api/.env` has correct DB credentials |
| Frontend blank or 404 | Ensure document root is the folder with index.html and .htaccess, not api/ |
| CORS errors | `SITE_URL` in `api/.env` must match your domain |
| Static files not loading | Check `public_html/.next/static/` exists |
| Images not showing | Check `public_html/public/` folder was uploaded |
