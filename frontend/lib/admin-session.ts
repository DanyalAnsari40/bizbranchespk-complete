import { cookies } from "next/headers"
import { getAdminSessionToken } from "@/lib/admin-session-token"

export { getAdminSessionToken } from "@/lib/admin-session-token"

export async function verifyAdminSession(): Promise<boolean> {
  const cookieStore = await cookies()
  const c = cookieStore.get("bizbranches_admin_session")
  return c?.value === getAdminSessionToken()
}
