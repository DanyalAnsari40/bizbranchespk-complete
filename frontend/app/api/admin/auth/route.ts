import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getAdminSessionToken } from "@/lib/admin-session"

export async function GET() {
  const cookieStore = await cookies()
  const c = cookieStore.get("bizbranches_admin_session")
  const ok = c?.value === getAdminSessionToken()
  return NextResponse.json({ ok })
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const password = String((body as { password?: string }).password ?? "")
  const expected =
    process.env.ADMIN_PANEL_PASSWORD ?? process.env.ADMIN_SECRET ?? ""
  if (!expected) {
    return NextResponse.json(
      { ok: false, error: "Admin login is not configured on the server." },
      { status: 500 }
    )
  }
  if (password !== expected) {
    return NextResponse.json({ ok: false, error: "Invalid password" }, { status: 401 })
  }

  const token = getAdminSessionToken()
  const res = NextResponse.json({ ok: true })
  res.cookies.set("bizbranches_admin_session", token, {
    httpOnly: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  })
  return res
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true })
  res.cookies.set("bizbranches_admin_session", "", {
    httpOnly: true,
    path: "/",
    maxAge: 0,
  })
  return res
}
