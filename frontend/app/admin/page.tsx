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
  status?: string | null
  category: string | null
  city: string | null
  phone: string | null
  whatsapp: string | null
  email: string | null
  address: string | null
  description: string | null
  website_url: string | null
  facebook_url: string | null
  gmb_url: string | null
  youtube_url: string | null
  sender_name: string | null
  payment_proof_url: string | null
  payment_proof_verified_at?: string | null
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
  const [editingId, setEditingId] = useState<number | null>(null)
  const [savingId, setSavingId] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState<Record<string, string>>({})
  const [statusFilter, setStatusFilter] = useState<"pending" | "approved" | "all">("pending")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const PAGE_SIZE = 10

  const fetchPending = useCallback(async () => {
    setListLoading(true)
    try {
      const res = await fetch(
        `/api/admin/business/list?status=${encodeURIComponent(statusFilter)}&page=${page}&limit=${PAGE_SIZE}`,
        { credentials: "include" },
      )
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
      const p = data?.pagination
      setTotalPages(Math.max(1, Number(p?.pages) || 1))
      setTotalItems(Math.max(0, Number(p?.total) || 0))
    } catch {
      toast({ title: "Network error", variant: "destructive" })
    } finally {
      setListLoading(false)
    }
  }, [toast, statusFilter, page])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch("/api/admin/session", { credentials: "include" })
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
  }, [authChecked, authenticated, fetchPending, statusFilter, page])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginSubmitting(true)
    try {
      const res = await fetch("/api/admin/session", {
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
      await fetch("/api/admin/session", { method: "DELETE", credentials: "include" })
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

  const startEdit = (b: PendingRow) => {
    setEditingId(b.id)
    setEditForm({
      name: b.name ?? "",
      category: b.category ?? "",
      city: b.city ?? "",
      phone: b.phone ?? "",
      whatsapp: b.whatsapp ?? "",
      email: b.email ?? "",
      address: b.address ?? "",
      description: b.description ?? "",
      website_url: b.website_url ?? "",
      facebook_url: b.facebook_url ?? "",
      gmb_url: b.gmb_url ?? "",
      youtube_url: b.youtube_url ?? "",
      sender_name: b.sender_name ?? "",
    })
  }

  const saveEdit = async (id: number) => {
    setSavingId(id)
    try {
      const res = await fetch("/api/admin/business/update", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...editForm }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast({
          title: "Update failed",
          description: typeof data?.error === "string" ? data.error : "Try again",
          variant: "destructive",
        })
        return
      }
      setItems((prev) =>
        prev.map((x) =>
          x.id === id
            ? {
                ...x,
                name: editForm.name ?? "",
                category: editForm.category ?? null,
                city: editForm.city ?? null,
                phone: editForm.phone ?? null,
                whatsapp: editForm.whatsapp ?? null,
                email: editForm.email ?? null,
                address: editForm.address ?? null,
                description: editForm.description ?? null,
                website_url: editForm.website_url ?? null,
                facebook_url: editForm.facebook_url ?? null,
                gmb_url: editForm.gmb_url ?? null,
                youtube_url: editForm.youtube_url ?? null,
                sender_name: editForm.sender_name ?? null,
              }
            : x,
        ),
      )
      setEditingId(null)
      setEditForm({})
      toast({ title: "Business updated" })
    } catch {
      toast({ title: "Network error", variant: "destructive" })
    } finally {
      setSavingId(null)
    }
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm("Delete this business listing? This cannot be undone.")) return
    setDeletingId(id)
    try {
      const res = await fetch("/api/admin/business/delete", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast({
          title: "Delete failed",
          description: typeof data?.error === "string" ? data.error : "Try again",
          variant: "destructive",
        })
        return
      }
      setItems((prev) => prev.filter((x) => x.id !== id))
      if (editingId === id) {
        setEditingId(null)
        setEditForm({})
      }
      toast({ title: "Business deleted" })
    } catch {
      toast({ title: "Network error", variant: "destructive" })
    } finally {
      setDeletingId(null)
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
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Business Management</h1>
          <p className="mt-1 text-sm text-slate-600">Review payment proof, approve, edit, or delete listings.</p>
        </div>
        <Button type="button" variant="outline" onClick={handleLogout} className="shrink-0 gap-2">
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
      </div>
      <div className="mb-6 flex flex-wrap gap-2">
        <Button
          type="button"
          variant={statusFilter === "pending" ? "default" : "outline"}
          onClick={() => {
            setStatusFilter("pending")
            setPage(1)
          }}
        >
          Pending
        </Button>
        <Button
          type="button"
          variant={statusFilter === "approved" ? "default" : "outline"}
          onClick={() => {
            setStatusFilter("approved")
            setPage(1)
          }}
        >
          Approved
        </Button>
        <Button
          type="button"
          variant={statusFilter === "all" ? "default" : "outline"}
          onClick={() => {
            setStatusFilter("all")
            setPage(1)
          }}
        >
          All
        </Button>
      </div>

      {listLoading ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white py-20 shadow-sm">
          <Loader2 className="h-10 w-10 animate-spin text-emerald-600" aria-hidden />
          <p className="text-sm font-medium text-slate-600">Loading pending listings…</p>
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-sm">
          <p className="text-base font-medium text-slate-700">No listings found</p>
          <p className="mt-1 text-sm text-slate-500">New submissions will appear here.</p>
        </div>
      ) : (
        <>
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
                  <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">
                    Status: {b.status || "pending"}
                  </p>
                  <p className="text-xs text-slate-400">
                    Submitted {b.created_at ? new Date(b.created_at).toLocaleString() : "—"}
                  </p>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                  <div className="grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
                    <p><span className="font-medium text-slate-500">Category:</span> {b.category?.trim() || "—"}</p>
                    <p><span className="font-medium text-slate-500">City:</span> {b.city?.trim() || "—"}</p>
                    <p><span className="font-medium text-slate-500">Phone:</span> {b.phone?.trim() || "—"}</p>
                    <p><span className="font-medium text-slate-500">WhatsApp:</span> {b.whatsapp?.trim() || "—"}</p>
                    <p className="sm:col-span-2"><span className="font-medium text-slate-500">Email:</span> {b.email?.trim() || "—"}</p>
                    <p className="sm:col-span-2"><span className="font-medium text-slate-500">Address:</span> {b.address?.trim() || "—"}</p>
                  </div>

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
                      <p className="p-6 text-sm text-slate-700">
                        {b.payment_proof_verified_at
                          ? "Payment verified by admin."
                          : "No payment proof URL on file."}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button
                      type="button"
                      className="w-full min-h-11 bg-emerald-600 hover:bg-emerald-700 sm:w-auto sm:min-w-[140px]"
                      disabled={approvingId === b.id || b.status === "approved"}
                      onClick={() => handleApprove(b.id)}
                    >
                      {approvingId === b.id ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Approving…
                        </>
                      ) : b.status === "approved" ? (
                        "Already approved"
                      ) : (
                        "Approve"
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full min-h-11 sm:w-auto"
                      onClick={() => startEdit(b)}
                    >
                      Edit
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      className="w-full min-h-11 sm:w-auto"
                      disabled={deletingId === b.id}
                      onClick={() => handleDelete(b.id)}
                    >
                      {deletingId === b.id ? "Deleting…" : "Delete"}
                    </Button>
                  </div>

                  {editingId === b.id && (
                    <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Input value={editForm.name ?? ""} onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))} placeholder="Business name" />
                        <Input value={editForm.category ?? ""} onChange={(e) => setEditForm((p) => ({ ...p, category: e.target.value }))} placeholder="Category" />
                        <Input value={editForm.city ?? ""} onChange={(e) => setEditForm((p) => ({ ...p, city: e.target.value }))} placeholder="City" />
                        <Input value={editForm.sender_name ?? ""} onChange={(e) => setEditForm((p) => ({ ...p, sender_name: e.target.value }))} placeholder="Sender name" />
                        <Input value={editForm.phone ?? ""} onChange={(e) => setEditForm((p) => ({ ...p, phone: e.target.value }))} placeholder="Phone" />
                        <Input value={editForm.whatsapp ?? ""} onChange={(e) => setEditForm((p) => ({ ...p, whatsapp: e.target.value }))} placeholder="WhatsApp" />
                        <Input value={editForm.email ?? ""} onChange={(e) => setEditForm((p) => ({ ...p, email: e.target.value }))} placeholder="Email" className="sm:col-span-2" />
                        <Input value={editForm.address ?? ""} onChange={(e) => setEditForm((p) => ({ ...p, address: e.target.value }))} placeholder="Address" className="sm:col-span-2" />
                        <Input value={editForm.website_url ?? ""} onChange={(e) => setEditForm((p) => ({ ...p, website_url: e.target.value }))} placeholder="Website URL" className="sm:col-span-2" />
                        <Input value={editForm.facebook_url ?? ""} onChange={(e) => setEditForm((p) => ({ ...p, facebook_url: e.target.value }))} placeholder="Facebook URL" className="sm:col-span-2" />
                        <Input value={editForm.gmb_url ?? ""} onChange={(e) => setEditForm((p) => ({ ...p, gmb_url: e.target.value }))} placeholder="Google Business URL" className="sm:col-span-2" />
                        <Input value={editForm.youtube_url ?? ""} onChange={(e) => setEditForm((p) => ({ ...p, youtube_url: e.target.value }))} placeholder="YouTube URL" className="sm:col-span-2" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`desc-${b.id}`}>Description</Label>
                        <Input
                          id={`desc-${b.id}`}
                          value={editForm.description ?? ""}
                          onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))}
                          placeholder="Description"
                        />
                      </div>
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <Button type="button" disabled={savingId === b.id} onClick={() => saveEdit(b.id)}>
                          {savingId === b.id ? "Saving…" : "Save changes"}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setEditingId(null)
                            setEditForm({})
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
              </li>
            ))}
          </ul>
          <div className="mt-6 flex flex-col items-start justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center">
            <p className="text-sm text-slate-600">
              Showing page {page} of {totalPages} ({totalItems} total)
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
