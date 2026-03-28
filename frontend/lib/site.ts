/**
 * Canonical site URL for SEO (meta canonical, Open Graph, schema).
 * Prefer env in production; fallback for local/dev.
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://bizbranches.pk");

export const SITE_NAME = "BizBranches";

/** Official WhatsApp chat link (support / listings help). */
export const SITE_WHATSAPP_URL = "https://wa.me/923142552851";

export const SITE_DESCRIPTION =
  "Pakistan's free business listing directory. Find local businesses, add your business free, and connect with customers across Pakistan.";

/** Canonical logo path (header, footer, favicon, PWA). */
export const SITE_LOGO_PATH = "/bizbranches.pk.png";
