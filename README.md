# BizBranches

Pakistan business directory: Next.js static frontend + PHP API + MySQL.

## Stack

- **Frontend:** Next.js 15 (static export), React, Tailwind, shadcn/ui
- **Backend:** PHP 8.2, MySQL
- **Deploy:** GitHub Actions → cPanel (SSH/rsync or FTP)

## Quick start

```bash
npm install
cd frontend && npm install
```

**Local dev (PHP API + Next.js):**

```bash
npm run dev
```

- Frontend: http://localhost:3000  
- API: http://localhost:3002 (PHP)

**Production build:**

```bash
npm run build
```

Static output: `frontend/out/`. Deploy `frontend/out/` to web root and `backend-php/` to `api/` (see [CPANEL_DEPLOYMENT.md](CPANEL_DEPLOYMENT.md)).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | PHP backend + Next.js dev |
| `npm run build` | Install deps + build frontend (static export) |
| `npm run start` | PHP backend + Next.js serve (uses `start-php.sh`) |

## Docs

- [CPANEL_DEPLOYMENT.md](CPANEL_DEPLOYMENT.md) — cPanel + GitHub CI/CD
- [backend-php/README.md](backend-php/README.md) — PHP API setup
- [SEO_IMPLEMENTATION.md](SEO_IMPLEMENTATION.md) — SEO summary
