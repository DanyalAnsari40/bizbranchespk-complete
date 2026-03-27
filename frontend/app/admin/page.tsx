"use client"

import { useCallback, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Loader2, LogOut, ShieldCheck } from "lucide-react"

const ADMIN_TOKEN_KEY = "admin_token"

type PendingRow = {
  id: number
  name: string
  sender_name: string | null
  payment_proof_url: string | null
  created_at: string
}

function isPdfUrl(url: string | null | undefined): boolean {
  if (!url) return false
  return /\.pdf($|\?)/i.test(url) || url.toLowerCase().includes("/raw/upload")
}

export default function AdminPage() {
  const { toast } = useToast()
  const [password, setPassword] = useState("")
  const [authChecked, setAuthChecked] = useState(false)
  const [authenticated, setAuthenticated] = useState(false)
  const [loginSubmitting, setLoginSubmitting] = useState(false)
  const [listLoading, setListLoading] = useState(false)
  const [items, setItems] = useState<PendingRow[]>([])
  const [approvingId, setApprovingId] = useState<number | null>(null)

  const fetchPending = useCallback(async () => {
    setListLoading(true)
    try {
      const res = await fetch("/api/admin/business/pending", { credentials: "include" })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast({
          title: "Could not load listings",
          description: typeof data?.error === "string" ? data.error : "Try signing in again.",
          variant: "destructive",
        })
        return
      }
      const list = Array.isArray(data?.businesses) ? data.businesses : []
      setItems(list)
    } catch {
      toast({ title: "Network error", variant: "destructive" })
    } finally {
      setListLoading(false)
    }
  }, [toast])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch("/api/admin/auth", { credentials: "include" })
        const data = await res.json().catch(() => ({}))
        if (cancelled) return
        if (data?.ok) {
          setAuthenticated(true)
          try {
            localStorage.setItem(ADMIN_TOKEN_KEY, "1")
          } catch {
            /* ignore */
          }
        } else {
          setAuthenticated(false)
          try {
            if (!localStorage.getItem(ADMIN_TOKEN_KEY)) {
              /* no client token; stay on login */
            }
          } catch {
            /* ignore */
          }
        }
      } finally {
        if (!cancelled) setAuthChecked(true)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!authChecked || !authenticated) return
    fetchPending()
  }, [authChecked, authenticated, fetchPending])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginSubmitting(true)
    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast({
          title: "Sign in failed",
          description: typeof data?.error === "string" ? data.error : "Check password",
          variant: "destructive",
        })
        return
      }
      try {
        localStorage.setItem(ADMIN_TOKEN_KEY, "1")
      } catch {
        /* ignore */
      }
      setPassword("")
      setAuthenticated(true)
      toast({ title: "Signed in" })
    } catch {
      toast({ title: "Network error", variant: "destructive" })
    } finally {
      setLoginSubmitting(false)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/auth", { method: "DELETE", credentials: "include" })
    } catch {
      /* ignore */
    }
    try {
      localStorage.removeItem(ADMIN_TOKEN_KEY)
    } catch {
      /* ignore */
    }
    setAuthenticated(false)
    setItems([])
    toast({ title: "Signed out" })
  }

  const handleApprove = async (id: number) => {
    setApprovingId(id)
    try {
      const res = await fetch("/api/admin/business/approve", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast({
          title: "Approve failed",
          description: typeof data?.error === "string" ? data.error : "Try again",
          variant: "destructive",
        })
        return
      }
      setItems((prev) => prev.filter((x) => x.id !== id))
      toast({ title: "Business approved" })
    } catch {
      toast({ title: "Network error", variant: "destructive" })
    } finally {
      setApprovingId(null)
    }
  }

  if (!authChecked) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-4">
        <div className="flex flex-col items-center gap-3 text-slate-600">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" aria-hidden />
          <p className="text-sm">Loading…</p>
        </div>
      </div>
    )
  }

  if (!authenticated) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-12 sm:py-16">
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100">
            <ShieldCheck className="h-7 w-7 text-emerald-700" aria-hidden />
          </div>
          <h1 className="text-xl font-bold text-slate-900">Admin sign in</h1>
          <p className="mt-1 text-sm text-slate-600">Enter the admin password to continue.</p>
        </div>
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Password</CardTitle>
            <CardDescription>Uses the same secret as the server admin panel.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="admin-password">Password</Label>
                <Input
                  id="admin-password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="min-h-11"
                  required
                />
              </div>
              <Button type="submit" className="w-full min-h-11 bg-emerald-600 hover:bg-emerald-700" disabled={loginSubmitting}>
                {loginSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in…
                  </>
                ) : (
                  "Continue"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:py-10">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Pending Business Approvals</h1>
          <p className="mt-1 text-sm text-slate-600">Review payment proof and approve listings.</p>
        </div>
        <Button type="button" variant="outline" onClick={handleLogout} className="shrink-0 gap-2">
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
      </div>

      {listLoading ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white py-20 shadow-sm">
          <Loader2 className="h-10 w-10 animate-spin text-emerald-600" aria-hidden />
          <p className="text-sm font-medium text-slate-600">Loading pending listings…</p>
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-sm">
          <p className="text-base font-medium text-slate-700">No pending listings</p>
          <p className="mt-1 text-sm text-slate-500">New submissions will appear here.</p>
        </div>
      ) : (
        <ul className="grid gap-6 sm:grid-cols-1">
          {items.map((b) => (
            <li key={b.id}>
              <Card className="overflow-hidden border-slate-200 shadow-sm">
                <CardHeader className="border-b border-slate-100 bg-white pb-4">
                  <CardTitle className="text-lg font-semibold text-slate-900">{b.name}</CardTitle>
                  <CardDescription className="text-base text-slate-700">
                    <span className="font-medium text-slate-500">Sender name:</span>{" "}
                    {b.sender_name?.trim() || "—"}
                  </CardDescription>
                  <p className="text-xs text-slate-400">
                    Submitted {b.created_at ? new Date(b.created_at).toLocaleString() : "—"}
                  </p>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                  <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                    {b.payment_proof_url ? (
                      isPdfUrl(b.payment_proof_url) ? (
                        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                          <p className="text-sm text-slate-600">Payment proof (PDF)</p>
                          <Button variant="secondary" size="sm" asChild>
                            <a href={b.payment_proof_url} target="_blank" rel="noopener noreferrer">
                              Open PDF
                            </a>
                          </Button>
                        </div>
                      ) : (
                        <div className="relative aspect-[16/10] w-full max-h-80 bg-slate-100">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={b.payment_proof_url}
                            alt={`Payment proof for ${b.name}`}
                            className="h-full w-full object-contain object-center"
                          />
                        </div>
                      )
                    ) : (
                      <p className="p-6 text-sm text-amber-800">No payment proof URL on file.</p>
                    )}
                  </div>
                  <Button
                    type="button"
                    className="w-full min-h-11 bg-emerald-600 hover:bg-emerald-700 sm:w-auto sm:min-w-[140px]"
                    disabled={approvingId === b.id}
                    onClick={() => handleApprove(b.id)}
                  >
                    {approvingId === b.id ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Approving…
                      </>
                    ) : (
                      "Approve"
                    )}
                  </Button>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
