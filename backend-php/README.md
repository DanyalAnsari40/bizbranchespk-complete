# BizBranches PHP Backend

PHP + MySQL API for the BizBranches directory. Serves `/api/*` for the Next.js frontend.

## Prerequisites

- PHP 8.1+
- MySQL 8.0+
- Composer

## Setup

From the **repository root**, you can create `backend-php/.env` from the local template (same values as below):

```bash
npm run setup:local
```

### 1. Install dependencies

```bash
cd backend-php
composer install
```

### 2. Environment

```bash
cp .env.example .env
# Or use env.local.template → .env via npm run setup:local from repo root
# Edit .env: DB_HOST, DB_NAME, DB_USER, DB_PASS, CLOUDINARY_*, SMTP_*, etc.
```

### 3. Database

Create the database, then run:

```bash
mysql -u root -p your_db_name < migrations/001_create_tables.sql
```

Optional (if you already have tables from an older run):

```bash
mysql -u root -p your_db_name < migrations/002_fix_import_columns.sql
```

### 4. Run locally

```bash
php -S 0.0.0.0:3002 index.php
```

Or from project root: `npm run dev` (starts PHP + Next.js).

## API (main)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/ping` | Health check |
| GET | `/api/db-health` | DB check |
| GET | `/api/business` | List businesses (paginated, filtered) |
| GET | `/api/business/:slug` | Business by slug or id |
| POST | `/api/business` | Create business |
| GET | `/api/categories` | Categories |
| GET | `/api/cities` | Cities |
| GET | `/api/search` | Autocomplete |
| GET | `/api/reviews` | Reviews for business |
| POST | `/api/reviews` | Submit review |
| GET | `/api/sitemap/businesses` | Sitemap data |
| GET | `/api/sitemap/geo-pages` | City/category/area combos |

## Structure

```
backend-php/
├── config/       # config.php, database.php
├── lib/          # Helpers (Router, Response, Cloudinary, etc.)
├── routes/       # API route handlers
├── migrations/   # SQL schema
├── data/         # pakistan-cities.json
├── scripts/      # (optional uploads; not in repo)
├── index.php
└── composer.json
```
