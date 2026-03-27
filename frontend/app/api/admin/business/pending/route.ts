import { NextResponse } from "next/server"
import { getBackendUrl } from "@/lib/api"
import { verifyAdminSession } from "@/lib/admin-session"

export async function GET() {
  if (!(await verifyAdminSession())) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
  }
  const secret = process.env.ADMIN_SECRET
  if (!secret) {
    return NextResponse.json({ ok: false, error: "Server misconfigured" }, { status: 500 })
  }

  const res = await fetch(`${getBackendUrl()}/api/admin/business/pending`, {
    headers: { "X-Admin-Secret": secret },
    cache: "no-store",
  })
  const data = await res.json().catch(() => ({ ok: false, error: "Invalid JSON" }))
  return NextResponse.json(data, { status: res.status })
}
