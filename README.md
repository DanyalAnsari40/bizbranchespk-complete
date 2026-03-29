# BizBranches

Pakistan business directory: Next.js static frontend + PHP API + MySQL.

## Stack

- **Frontend:** Next.js 15 (static export), React, Tailwind, shadcn/ui
- **Backend:** PHP 8.2, MySQL
- **Deploy:** Manual — build locally, zip and upload to cPanel (see [CPANEL_DEPLOYMENT.md](CPANEL_DEPLOYMENT.md)). No GitHub Actions deploy on push.

## Quick start

**Requirements:** Node 18+, PHP 8.1+, Composer, MySQL 8 (local server such as XAMPP, Laragon, or MySQL installer).

```bash
npm install
cd frontend && npm install
cd ..
```

**One-time local environment** — creates `frontend/.env.local` and `backend-php/.env` from templates (skipped if they already exist):

```bash
npm run setup:local
```

Edit `backend-php/.env` if your MySQL user, password, or database name differs. Create the database (e.g. `bizbranches_local`), then import the schema:

```bash
mysql -u root -p bizbranches_local < backend-php/migrations/001_create_tables.sql
```

On Windows without the `mysql` CLI, create the empty database in phpMyAdmin or MySQL Workbench, then use **Import** with `backend-php/migrations/001_create_tables.sql`.

Install PHP dependencies:

```bash
cd backend-php && composer install && cd ..
```

**Local dev (PHP API + Next.js):**

```bash
npm run dev
```

- Frontend: http://localhost:3000  
- API: http://localhost:3002 (PHP built-in server)  
- API health: http://localhost:3002/api/ping

**Production build:**

```bash
npm run build
```

Static output: `frontend/out/`. Deploy `frontend/out/` to web root and `backend-php/` to `api/` (see [CPANEL_DEPLOYMENT.md](CPANEL_DEPLOYMENT.md)).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run setup:local` | Copy `env.local.template` → `.env.local` / `.env` (first run) |
| `npm run dev` | PHP backend + Next.js dev |
| `npm run build` | Install deps + build frontend (static export) |
| `npm run start` | PHP backend + Next.js serve (uses `start-php.sh`) |

## Docs

- [CPANEL_DEPLOYMENT.md](CPANEL_DEPLOYMENT.md) — cPanel manual deployment
- [backend-php/README.md](backend-php/README.md) — PHP API setup
- [SEO_IMPLEMENTATION.md](SEO_IMPLEMENTATION.md) — SEO summary
