import { NextResponse } from "next/server"
import { getBackendUrl } from "@/lib/api"
import { verifyAdminSession } from "@/lib/admin-session"

export async function POST(request: Request) {
  if (!(await verifyAdminSession())) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
  }
  const secret = process.env.ADMIN_SECRET
  if (!secret) {
    return NextResponse.json({ ok: false, error: "Server misconfigured" }, { status: 500 })
  }

  const body = await request.json().catch(() => ({}))
  const res = await fetch(`${getBackendUrl()}/api/admin/business/approve`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Admin-Secret": secret,
    },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({ ok: false, error: "Invalid JSON" }))
  return NextResponse.json(data, { status: res.status })
}
