import crypto from "crypto"
import { cookies } from "next/headers"

/** Stable session value derived from server env (not stored per-login). */
export function getAdminSessionToken(): string {
  const secret = process.env.ADMIN_SECRET ?? ""
  const pass = process.env.ADMIN_PANEL_PASSWORD ?? process.env.ADMIN_SECRET ?? ""
  return crypto.createHmac("sha256", secret).update("bizbranches-admin:" + pass).digest("hex")
}

export async function verifyAdminSession(): Promise<boolean> {
  const cookieStore = await cookies()
  const c = cookieStore.get("bizbranches_admin_session")
  return c?.value === getAdminSessionToken()
}
