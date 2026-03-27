import crypto from "crypto"

/**
 * Stable session cookie value derived from server env (not stored per-login).
 * Kept separate from cookie verification so route handlers only pull Node crypto here.
 */
export function getAdminSessionToken(): string {
  const secret = process.env.ADMIN_SECRET ?? ""
  const pass = process.env.ADMIN_PANEL_PASSWORD ?? process.env.ADMIN_SECRET ?? ""
  return crypto.createHmac("sha256", secret).update("bizbranches-admin:" + pass).digest("hex")
}
