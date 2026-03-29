/**
 * Creates frontend/.env.local and backend-php/.env from env.local.template files
 * if they do not already exist.
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");

const pairs = [
  ["frontend/env.local.template", "frontend/.env.local"],
  ["backend-php/env.local.template", "backend-php/.env"],
];

let created = 0;
for (const [relSrc, relDest] of pairs) {
  const src = path.join(root, relSrc);
  const dest = path.join(root, relDest);
  if (!fs.existsSync(src)) {
    console.warn("Missing template:", relSrc);
    continue;
  }
  if (fs.existsSync(dest)) {
    console.log("Keep existing:", relDest);
    continue;
  }
  fs.copyFileSync(src, dest);
  console.log("Created", relDest);
  created++;
}

if (created === 0) {
  console.log("No new env files (already present). Edit frontend/.env.local and backend-php/.env as needed.");
} else {
  console.log("\nNext: create MySQL database, import backend-php/migrations/001_create_tables.sql, then:");
  console.log("  cd backend-php && composer install");
  console.log("  npm run dev");
}
