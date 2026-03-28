"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useLayoutEffect, useState } from "react"
import { createPortal } from "react-dom"
import {
  Home,
  LayoutGrid,
  Plus,
  Globe2,
  MapPin,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"

const DIRECTORIES = [
  { label: "Pakistan", href: "https://bizbranches.pk", flag: "🇵🇰" },
  { label: "United Kingdom", href: "https://bizbranches.uk", flag: "🇬🇧" },
  { label: "United States", href: "https://bizbranches.us", flag: "🇺🇸" },
] as const

function NavTab({
  href,
  onClick,
  active,
  icon: Icon,
  label,
}: {
  href?: string
  onClick?: () => void
  active?: boolean
  icon: typeof Home
  label: string
}) {
  const className = cn(
    "flex min-w-0 flex-1 flex-col items-center justify-end gap-0.5 rounded-2xl px-1 py-1.5 transition-all duration-200",
    active
      ? "text-emerald-300"
      : "text-slate-400 hover:text-white active:scale-95",
  )
  const inner = (
    <>
      <span
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-xl transition-transform duration-200",
          active
            ? "bg-white/15 text-emerald-300 shadow-inner ring-1 ring-white/20"
            : "bg-transparent text-current",
        )}
      >
        <Icon className="h-[18px] w-[18px]" strokeWidth={2.2} aria-hidden />
      </span>
      <span className="max-w-[4.25rem] truncate text-[9px] font-semibold tracking-wide">{label}</span>
    </>
  )
  if (href) {
    return (
      <Link href={href} className={className} aria-current={active ? "page" : undefined}>
        {inner}
      </Link>
    )
  }
  return (
    <button type="button" onClick={onClick} className={className}>
      {inner}
    </button>
  )
}

export function MobileBottomNav() {
  const pathname = usePathname()
  const [dirOpen, setDirOpen] = useState(false)
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null)

  useLayoutEffect(() => {
    setPortalTarget(document.body)
  }, [])

  if (pathname?.startsWith("/admin") || pathname?.startsWith("/control-room")) {
    return null
  }

  const isHome = pathname === "/"
  const isCategories = pathname === "/category" || pathname?.startsWith("/category/")
  const isCities = pathname === "/search" || pathname?.startsWith("/city/")

  const content = (
    <>
      <nav
        className="fixed inset-x-0 bottom-0 z-40 md:hidden pointer-events-none"
        style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
        aria-label="Main mobile navigation"
      >
        {/* Curved bar + floating center Add */}
        <div className="pointer-events-auto relative mx-auto max-w-md px-3">
          <div
            className={cn(
              "relative overflow-visible rounded-t-[1.75rem] border border-white/10 bg-slate-900/92 pb-1 pt-2 shadow-[0_-12px_40px_rgba(15,23,42,0.45)] backdrop-blur-xl",
              "before:pointer-events-none before:absolute before:inset-x-8 before:-top-px before:h-px before:bg-gradient-to-r before:from-transparent before:via-emerald-400/40 before:to-transparent",
            )}
          >
            {/* soft inner curve highlight */}
            <div
              className="pointer-events-none absolute inset-x-0 top-0 h-8 rounded-t-[1.75rem] bg-gradient-to-b from-white/[0.07] to-transparent"
              aria-hidden
            />

            <div className="relative flex items-end justify-between gap-0 px-1">
              <NavTab href="/" icon={Home} label="Home" active={isHome} />
              <NavTab href="/category" icon={LayoutGrid} label="Categories" active={isCategories} />

              {/* Center Add — overlaps bar */}
              <div className="relative z-10 flex w-[4.5rem] shrink-0 flex-col items-center justify-end">
                <Link
                  href="/add"
                  className="absolute -top-7 left-1/2 flex h-[3.75rem] w-[3.75rem] -translate-x-1/2 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-600 text-white shadow-[0_8px_28px_rgba(16,185,129,0.55)] ring-4 ring-slate-950 transition-transform active:scale-95 hover:from-emerald-300 hover:to-teal-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
                  aria-label="Add your business"
                >
                  <Plus className="h-8 w-8 stroke-[2.5]" aria-hidden />
                </Link>
                <span className="h-6" aria-hidden />
                <span className="text-[9px] font-bold tracking-wide text-emerald-300/90">Add</span>
              </div>

              <NavTab onClick={() => setDirOpen(true)} icon={Globe2} label="Directory" active={dirOpen} />
              <NavTab href="/#browse-cities" icon={MapPin} label="Cities" active={isCities} />
            </div>
          </div>
        </div>
      </nav>

      <Sheet open={dirOpen} onOpenChange={setDirOpen}>
        <SheetContent
          side="bottom"
          className="rounded-t-2xl border-t border-slate-200 bg-gradient-to-b from-slate-50 to-white px-4 pb-10 pt-2 max-h-[85vh]"
        >
          <SheetHeader className="text-left space-y-1 pb-4">
            <SheetTitle className="text-lg font-bold text-slate-900">BizBranches directories</SheetTitle>
            <SheetDescription className="text-sm text-slate-600">
              Choose a country site — same quality listings, local to each region.
            </SheetDescription>
          </SheetHeader>
          <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/90 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3">Country</th>
                  <th className="px-4 py-3">Visit</th>
                </tr>
              </thead>
              <tbody>
                {DIRECTORIES.map((row) => (
                  <tr key={row.href} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-3.5 font-medium text-slate-900">
                      <span className="mr-2 text-lg" aria-hidden>
                        {row.flag}
                      </span>
                      {row.label}
                    </td>
                    <td className="px-4 py-3.5">
                      <a
                        href={row.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setDirOpen(false)}
                        className="inline-flex items-center rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700"
                      >
                        Open
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )

  if (portalTarget) {
    return createPortal(content, portalTarget)
  }

  return content
}
