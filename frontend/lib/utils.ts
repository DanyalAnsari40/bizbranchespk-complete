import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Digits only for wa.me (Pakistan: ensure leading 92). */
export function toWhatsAppDigits(phone: string): string {
  const d = String(phone).replace(/\D/g, "")
  if (!d) return ""
  if (d.startsWith("92")) return d
  if (d.startsWith("0")) return "92" + d.slice(1)
  if (d.length === 10 && d.startsWith("3")) return "92" + d
  return d
}

export function whatsappChatUrl(phone: string): string {
  const digits = toWhatsAppDigits(phone)
  return digits ? `https://wa.me/${digits}` : "#"
}

/** Reusable slug for URLs (categories, cities, etc.) */
export const slugify = (s: string): string =>
  String(s)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")

/** Truncate text to length with ellipsis */
export const truncate = (text: string, maxLen: number): string =>
  text.length <= maxLen ? text : `${text.slice(0, maxLen - 3).trim()}...`

/** Single source for business logo URL (Cloudinary or placeholder). Reused by all listing cards. */
export const getBusinessLogoUrl = (
  logo?: string | null,
  size: "thumb" | "medium" | "large" = "thumb"
): string => {
  const raw = logo ?? ""
  if (!raw) return "/placeholder.svg"
  if (/^https?:\/\//i.test(raw)) return raw
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  if (!cloudName) return "/placeholder.svg"
  const cleanId = String(raw)
    .replace(/\.[^/.]+$/, "")
    .trim()
    .replace(/^\/+/, "")
    .replace(/\/+/g, "/") || ""
  if (!cleanId) return "/placeholder.svg"
  const dim = size === "thumb" ? "200" : size === "medium" ? "400" : "600"
  return `https://res.cloudinary.com/${cloudName}/image/upload/c_fit,w_${dim},h_${dim},q_auto,f_auto/${cleanId}`
}