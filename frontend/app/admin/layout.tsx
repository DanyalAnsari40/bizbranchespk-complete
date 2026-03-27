import type { Metadata } from "next"
import type { ReactNode } from "react"

export const metadata: Metadata = {
  title: "Admin — Pending approvals",
  robots: { index: false, follow: false },
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-[calc(100vh-var(--header-footer-offset,0px))] bg-slate-50">{children}</div>
  )
}
