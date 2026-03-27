"use client"

/**
 * Success page ad placements — use separate AdSense units for better revenue.
 * In AdSense: create 3 ad units and set these env vars (numeric slot IDs):
 *
 *   NEXT_PUBLIC_ADSENSE_SLOT_SUCCESS_ABOVE_FOLD  — Responsive display (above the fold)
 *   NEXT_PUBLIC_ADSENSE_SLOT_SUCCESS_IN_CONTENT  — Responsive or In-article (between content)
 *   NEXT_PUBLIC_ADSENSE_SLOT_SUCCESS_FOOTER      — Responsive display (footer)
 *
 * Recommended types: Responsive for all three (works with current component).
 * Optional: create the middle one as "In-article" in AdSense for a more native look.
 */
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { CheckCircle, PlusCircle, Home } from "lucide-react"
import { AdSenseSlot } from "@/components/adsense-slot"
import { SITE_NAME } from "@/lib/site"
import { Suspense } from "react"

function getSuccessAdSlots() {
  return {
    aboveFold: process.env.NEXT_PUBLIC_ADSENSE_SLOT_SUCCESS_ABOVE_FOLD || undefined,
    inContent: process.env.NEXT_PUBLIC_ADSENSE_SLOT_SUCCESS_IN_CONTENT || undefined,
    footer: process.env.NEXT_PUBLIC_ADSENSE_SLOT_SUCCESS_FOOTER || undefined,
  }
}

function SuccessContent() {
  const searchParams = useSearchParams()
  const adSlots = getSuccessAdSlots()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-teal-50/30">
      <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 max-w-2xl">
        {/* Success message — above the fold */}
        <section className="text-center mb-6 sm:mb-8" aria-live="polite">
          <div className="inline-flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-full bg-emerald-100 ring-4 ring-emerald-200/60 mb-6" aria-hidden>
            <CheckCircle className="h-10 w-10 sm:h-12 sm:w-12 text-emerald-600" />
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Your business has been registered successfully!
          </h1>
          <p className="text-gray-600 text-base sm:text-lg">
            Thank you for your submission. Your listing is now under admin review and payment verification.
          </p>
          <p className="mt-4 text-sm font-semibold text-emerald-700">
            It will go live within 6 hours after approval.
          </p>
          <p className="mt-2 text-sm text-gray-600">
            You will receive a confirmation email once your listing is published.
          </p>
          <p className="mt-2 text-sm font-medium text-slate-700">
            Your business will be featured as a premium listing and shown prominently on our homepage after approval.
          </p>
        </section>

        {/* Ad placement 1 — above the fold, non-blocking */}
        <div className="my-6 sm:my-8" role="complementary" aria-label="Advertisement">
          <div className="min-h-[90px] w-full" data-ad-placement="success-above-fold">
            <AdSenseSlot slotId="add-success-above-fold" adSlot={adSlots.aboveFold} className="my-0" />
          </div>
        </div>

        {/* Ad placement 2 — in-content */}
        <div className="my-6 sm:my-8" role="complementary" aria-label="Advertisement">
          <div className="min-h-[90px] w-full" data-ad-placement="success-in-content">
            <AdSenseSlot slotId="add-success-in-content" adSlot={adSlots.inContent} className="my-0" />
          </div>
        </div>

        {/* Next steps */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">What you can do next</h2>
          <ul className="space-y-3">
            <li>
              <Button asChild variant="outline" className="w-full justify-start h-12 gap-3 rounded-xl" size="lg">
                <Link href="/search">
                  <Home className="h-5 w-5 shrink-0" aria-hidden />
                  Browse the directory
                </Link>
              </Button>
            </li>
            <li>
              <Button asChild variant="outline" className="w-full justify-start h-12 gap-3 rounded-xl" size="lg">
                <Link href="/add">
                  <PlusCircle className="h-5 w-5 shrink-0" aria-hidden />
                  Add another business
                </Link>
              </Button>
            </li>
            <li>
              <Button asChild variant="outline" className="w-full justify-start h-12 gap-3 rounded-xl" size="lg">
                <Link href="/">
                  <Home className="h-5 w-5 shrink-0" aria-hidden />
                  Return to home
                </Link>
              </Button>
            </li>
          </ul>
        </section>

        {/* Ad placement 3 — bottom, mobile-optimized */}
        <div className="my-6 sm:my-8" role="complementary" aria-label="Advertisement">
          <div className="min-h-[90px] w-full" data-ad-placement="success-footer">
            <AdSenseSlot slotId="add-success-footer" adSlot={adSlots.footer} className="my-0" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AddSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-emerald-50/30">
        <div className="animate-pulse text-gray-500">Loading…</div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  )
}
