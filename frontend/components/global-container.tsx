"use client"

import { PropsWithChildren } from "react"
import { usePathname } from "next/navigation"

export default function GlobalContainer({ children }: PropsWithChildren) {
  const pathname = usePathname() || "/"

  // Only wrap known top-level listing/utility sections. Everything else, including clean
  // business detail pages like '/:slug', renders at full width with page-level paddings.
  const shouldWrap = (
    pathname.startsWith("/add") ||
    pathname.startsWith("/search") ||
    pathname.startsWith("/city") ||
    pathname.startsWith("/category") ||
    pathname.startsWith("/pending")
  )

  if (!shouldWrap) return <>{children}</>

  // Use full width for the /search route so its own grid can manage 15%/70%/15% layout.
  // Keep 70% width for other sections to retain the centered content style.
  const wrapClass = pathname.startsWith("/search") ? "w-full" : "md:w-[70%]"

  return (
    <div className={`mx-auto w-full ${wrapClass} min-h-[calc(100vh-var(--header-footer-offset,0px))]`}>
      {children}
    </div>
  )
}
