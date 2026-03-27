"use client"

import { useMemo, useState, useEffect, useRef } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

// Global top search bar (single expanded search field)
export function GlobalTopbar() {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()

  // Hide on homepage, business detail pages, and Add Business page
  const hidden = useMemo(() => {
    if (!pathname) return false
    if (pathname === "/") return true
    if (pathname.startsWith("/business/")) return true
    if (pathname.startsWith("/add")) return true
    if (pathname.startsWith("/admin")) return true
    // Also hide on clean business detail routes at '/:slug' (single segment),
    // but keep visible on known top-level routes
    const isSingleSegment = /^\/[^/]+\/?$/.test(pathname)
    if (isSingleSegment) {
      // Do NOT include "/" here; homepage is handled above. This ensures "/:slug" is treated as business detail.
      const topLevel = ["/add", "/search", "/city", "/category"]
      const isKnownTopLevel = topLevel.some((p) => pathname.startsWith(p))
      if (!isKnownTopLevel) return true
    }
    return false
  }, [pathname])

  const [q, setQ] = useState<string>(searchParams.get("q") || "")

  // Autocomplete state
  const [businessSuggestions, setBusinessSuggestions] = useState<any[]>([])
  const [categorySuggestions, setCategorySuggestions] = useState<any[]>([])
  const [combinedSuggestions, setCombinedSuggestions] = useState<Array<{ type: 'business' | 'category'; data: any }>>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Debounced fetch for suggestions
  useEffect(() => {
    const timer = setTimeout(async () => {
      const text = q.trim()
      if (!text) {
        setBusinessSuggestions([])
        setCategorySuggestions([])
        setCombinedSuggestions([])
        setShowSuggestions(false)
        setSelectedIndex(-1)
        return
      }
      try {
        const params = new URLSearchParams({ q: text, limit: '6' })
        // Use regex mode so it works even if text index isn't present
        const [bRes, cRes] = await Promise.all([
          fetch(`/api/business?${params.toString()}&searchMode=regex&suggest=1`, { cache: 'no-store' }),
          fetch(`/api/categories?q=${encodeURIComponent(text)}&limit=6`, { cache: 'no-store' }),
        ])
        const bJson = bRes.ok ? await bRes.json() : { businesses: [] }
        const cJson = cRes.ok ? await cRes.json() : { categories: [] }
        const b = (bJson?.businesses || []) as any[]
        const c = (cJson?.categories || []) as any[]
        setBusinessSuggestions(b)
        setCategorySuggestions(c)
        const combined: Array<{ type: 'business' | 'category'; data: any }> = [
          ...b.map((x) => ({ type: 'business' as const, data: x })),
          ...c.map((x) => ({ type: 'category' as const, data: x })),
        ]
        setCombinedSuggestions(combined)
        setShowSuggestions(combined.length > 0)
        setSelectedIndex(-1)
      } catch {
        setBusinessSuggestions([])
        setCategorySuggestions([])
        setCombinedSuggestions([])
        setShowSuggestions(false)
        setSelectedIndex(-1)
      }
    }, 200)
    return () => clearTimeout(timer)
  }, [q])

  // Click outside to close dropdown
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      const t = e.target as Node
      if (dropdownRef.current && !dropdownRef.current.contains(t) && inputRef.current && !inputRef.current.contains(t)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  const apply = (e?: React.FormEvent) => {
    e?.preventDefault()
    const params = new URLSearchParams()
    if (q.trim()) params.set("q", q.trim())
    const url = params.toString() ? `/search?${params.toString()}` : "/search"
    router.push(url)
    setShowSuggestions(false)
  }

  // Keyboard navigation in dropdown
  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || combinedSuggestions.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((i) => (i + 1) % combinedSuggestions.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((i) => (i - 1 + combinedSuggestions.length) % combinedSuggestions.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (selectedIndex >= 0 && selectedIndex < combinedSuggestions.length) {
        const sel = combinedSuggestions[selectedIndex]
        if (sel.type === 'business') {
          router.push(`/${sel.data.slug || sel.data.id}`)
        } else {
          router.push(`/category/${sel.data.slug}`)
        }
        setShowSuggestions(false)
      } else {
        apply()
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
    }
  }

  if (hidden) return null

  return (
    <div className="w-full border-b bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/50">
      <form onSubmit={apply} className="mx-auto w-full md:w-[70%] px-3 py-2 relative">
        <div className="flex items-center gap-2">
          <div className="relative flex-1 min-w-0">
            <Input
              ref={inputRef}
              placeholder="Search businesses, categories, or cities..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onFocus={() => setShowSuggestions(combinedSuggestions.length > 0)}
              onKeyDown={onKeyDown}
              className="w-full h-11 md:h-12 text-base md:text-lg pr-12"
            />
            {/* small search icon button inside input on the right */}
            <button
              type="submit"
              aria-label="Search"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-md bg-primary text-primary-foreground flex items-center justify-center hover:opacity-95"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                <path fillRule="evenodd" d="M10.5 3a7.5 7.5 0 015.916 12.157l3.713 3.714a.75.75 0 11-1.06 1.06l-3.714-3.713A7.5 7.5 0 1110.5 3zm0 1.5a6 6 0 100 12 6 6 0 000-12z" clipRule="evenodd" />
              </svg>
            </button>

            {showSuggestions && combinedSuggestions.length > 0 && (
              <div ref={dropdownRef} className="absolute z-50 mt-1 w-full rounded-md border bg-card shadow-lg overflow-hidden">
                {/* Businesses */}
                {businessSuggestions.length > 0 && (
                  <div className="px-3 py-2 text-[11px] uppercase tracking-wide text-muted-foreground">Businesses</div>
                )}
                {businessSuggestions.map((b, idx) => {
                  const gi = idx
                  const active = selectedIndex === gi
                  return (
                    <div
                      key={`b-${b.id || b._id || b.slug || idx}`}
                      className={`px-3 py-2 cursor-pointer border-t first:border-t-0 ${active ? 'bg-muted' : 'bg-card'} hover:bg-muted transition-colors`}
                      onMouseEnter={() => setSelectedIndex(gi)}
                      onMouseDown={(e) => { e.preventDefault(); router.push(`/${b.slug || b.id || b._id}`); setShowSuggestions(false) }}
                    >
                      <div className="flex items-center gap-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={b.image || b.logoUrl || "/placeholder.svg"} alt={b.name} className="w-8 h-8 rounded object-cover" onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg" }} />
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-foreground truncate">{b.name}</div>
                          <div className="text-xs text-muted-foreground truncate">{b.category} • {String(b.city || '').charAt(0).toUpperCase() + String(b.city || '').slice(1)}</div>
                        </div>
                      </div>
                    </div>
                  )
                })}

                {/* Categories */}
                {categorySuggestions.length > 0 && (
                  <div className="px-3 py-2 text-[11px] uppercase tracking-wide text-muted-foreground">Categories</div>
                )}
                {categorySuggestions.map((c, i) => {
                  const gi = businessSuggestions.length + i
                  const active = selectedIndex === gi
                  return (
                    <div
                      key={`c-${c.slug || i}`}
                      className={`px-3 py-2 cursor-pointer border-t ${active ? 'bg-muted' : 'bg-card'} hover:bg-muted transition-colors`}
                      onMouseEnter={() => setSelectedIndex(gi)}
                      onMouseDown={(e) => { e.preventDefault(); router.push(`/category/${c.slug}`); setShowSuggestions(false) }}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded bg-muted flex items-center justify-center text-base">{c.icon || '⭐'}</div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-foreground truncate">{c.name}</div>
                          <div className="text-xs text-muted-foreground truncate">View category</div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Visible text button removed as requested; icon button remains inside the input */}
        </div>
      </form>
    </div>
  )
}
