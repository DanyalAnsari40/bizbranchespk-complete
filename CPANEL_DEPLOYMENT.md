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
└── api/               ← PHP backend (deployed by CI/CD)
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

## Step 2: GitHub Secrets

Go to: **GitHub repo > Settings > Secrets and variables > Actions**

| Secret | Value |
|---|---|
| `FTP_SERVER` | `ftp.bizbranches.pk` |
| `FTP_USERNAME` | Your cPanel FTP username |
| `FTP_PASSWORD` | Your cPanel FTP password |
| `FTP_DEPLOY_DIR` | `/home/bizbranchespk/public_html/` |
| `SITE_URL` | `https://bizbranches.pk` |
| `CLOUDINARY_CLOUD_NAME` | Your Cloudinary cloud name |

**Important**: `FTP_DEPLOY_DIR` must end with `/` and be the full server path to `public_html`.

---

## Step 3: Deploy

Push to `main` branch → GitHub Actions automatically:
1. Builds Next.js → uploads to `public_html/`
2. Installs Composer deps → uploads PHP to `public_html/api/`

Or trigger manually: **GitHub > Actions > Run workflow**

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

### GitHub Action not running or deployment fails

1. **Action never runs**
   - Push is on the **main** branch (workflow triggers on `push` to `main`).
   - Or run it manually: **Actions** tab → **Deploy to cPanel via FTP** → **Run workflow** → **Run workflow**.

2. **"Check required secrets" fails**
   - Go to **Settings** → **Secrets and variables** → **Actions**.
   - Add: **FTP_SERVER**, **FTP_USERNAME**, **FTP_PASSWORD** (required).
   - Optional: **FTP_DEPLOY_DIR** (e.g. `/home/cpaneluser/public_html/`), **SITE_URL**, **CLOUDINARY_CLOUD_NAME**.

3. **FTP deploy step fails**
   - Check **FTP_SERVER**: use the hostname (e.g. `ftp.bizbranches.pk` or your host’s FTP server).
   - **FTP_DEPLOY_DIR**: for cPanel it’s usually the full path to the folder that should contain the site, e.g. `/home/your_cpanel_username/public_html/` (trailing slash). If you leave it empty, the workflow uses `public_html/` (relative to your FTP user’s home).

4. **Build fails**
   - See the **Build Next.js** step log. Fix any errors (e.g. missing env, API unreachable) and push again.

---

### You see `{"ok":true,"message":"BizBranches API Server (PHP)"}` instead of the website

The domain document root is pointing at the **API folder** instead of the folder that contains the **static site** and `api/`:

1. **Set document root to the folder that has the static site**  
   In **cPanel > Domains** (or **Subdomains**), edit `bizbranches.pk` and set **Document Root** to the directory that contains **both** `index.html` and `.htaccess` (frontend) **and** the `api/` subfolder. Example: `public_html` — **not** `public_html/api`.

2. **Add GitHub Secrets**  
   **Settings > Secrets > Actions**:  
   - `FTP_DEPLOY_DIR` = that folder’s full path, e.g. `/home/bizbranchespk/public_html/` (end with `/`).  
   - `SITE_URL` = `https://bizbranches.pk`

3. **Redeploy**  
   Push to `main` or run the **Deploy to cPanel via FTP** workflow. The workflow deploys the backend first, then builds the static site (calling your API for slugs) and uploads the `out/` contents to the root.

---

| Problem | Fix |
|---|---|
| `/api/*` returns 404 | Check `public_html/api/.htaccess` exists |
| API returns 500 | Check `public_html/api/.env` has correct DB credentials |
| Frontend blank or 404 | Ensure document root is the folder with index.html and .htaccess, not api/ |
| CORS errors | `SITE_URL` in `api/.env` must match your domain |
| Static files not loading | Check `public_html/.next/static/` exists |
| Images not showing | Check `public_html/public/` folder was uploaded |
