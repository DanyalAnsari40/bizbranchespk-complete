"use client"

import Link from "next/link"
import Image from "next/image"
import { MapPin, ExternalLink, Verified, BadgeCheck } from "lucide-react"
import { getBusinessLogoUrl } from "@/lib/utils"
import type { ListingBusiness, ListingCardVariant } from "@/lib/types"
import { cn } from "@/lib/utils"
import { useCallback, useState, memo } from "react"

const CARD_LINK_CLASS =
  "block focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-xl"
const VIEW_DETAILS_CLASS =
  "flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-primary/10 text-primary text-sm font-semibold border border-primary/20 hover:bg-primary hover:text-primary-foreground transition-colors duration-200"

interface ListingCardProps {
  business: ListingBusiness
  variant?: ListingCardVariant
  className?: string
  /** Premium blue verified badge (e.g. homepage top listings carousel). */
  showPremiumVerified?: boolean
}

/** Normalize API/mock shape to logo URL (supports logoUrl, logo, image). */
function logoFor(b: ListingBusiness, size: "thumb" | "medium" = "thumb") {
  const url = b.logoUrl ?? b.logo ?? b.image ?? ""
  return getBusinessLogoUrl(url || null, size)
}

function formatDistance(km: number): string {
  if (km < 1) return "< 1 km"
  if (km < 10) return `${km.toFixed(1)} km`
  return `${Math.round(km)} km`
}

/** Optimized logo image with next/image; falls back to placeholder on error. */
function BusinessLogo({
  src,
  alt = "",
  className,
  fill,
  sizes,
}: {
  src: string
  alt?: string
  className?: string
  fill?: boolean
  sizes?: string
}) {
  const [error, setError] = useState(false)
  const onError = useCallback(() => setError(true), [])
  if (error || !src || src === "/placeholder.svg") {
    return (
      <div className={cn("bg-muted", className)} style={fill ? { width: "100%", height: "100%" } : undefined} />
    )
  }
  if (fill) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes ?? "96px"}
        className={cn("object-cover", className)}
        loading="lazy"
        onError={onError}
      />
    )
  }
  return (
    <Image
      src={src}
      alt={alt}
      width={96}
      height={96}
      sizes={sizes ?? "96px"}
      className={className}
      loading="lazy"
      onError={onError}
    />
  )
}

function ListingCardInner({ business, variant = "compact", className, showPremiumVerified }: ListingCardProps) {
  const href = `/${business.slug || business.id}`
  const ariaLabel = `View details for ${business.name}`

  // Compact: list row (category, search list, pending)
  if (variant === "compact") {
    return (
      <Link href={href} className={cn(CARD_LINK_CLASS, "rounded-xl", className)} aria-label={ariaLabel}>
        <div className="rounded-xl border border-border bg-card shadow-sm hover:shadow-md hover:border-primary/25 transition-all duration-200 p-5 sm:p-6 min-h-[140px] sm:min-h-[160px]">
          <div className="flex items-start gap-4 sm:gap-6">
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-gray-100 border-2 border-gray-200 flex-shrink-0">
              <BusinessLogo
                src={logoFor(business, "thumb")}
                fill
                sizes="(max-width: 640px) 80px, 96px"
                className="object-cover"
              />
            </div>
            <div className="flex-1 min-w-0 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-bold text-lg sm:text-xl text-gray-900 truncate">{business.name}</h3>
                  {business.status === "approved" && <Verified className="h-5 w-5 text-blue-500 flex-shrink-0" aria-hidden />}
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600 mb-2">
                  <span className="bg-primary/10 text-primary px-2.5 py-1 rounded-lg text-xs font-semibold">{business.category}</span>
                  {business.city && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4 text-primary" aria-hidden />
                      <span className="font-medium">{business.city}</span>
                    </span>
                  )}
                  {business.distanceKm != null && (
                    <span className="text-primary font-medium">{formatDistance(business.distanceKm)}</span>
                  )}
                </div>
                {business.description && (
                  <p className="text-sm text-gray-600 line-clamp-1 mb-2 leading-relaxed">{business.description}</p>
                )}
              </div>
              <p className="text-primary font-semibold text-sm mt-2 flex items-center gap-1">
                View Details <ExternalLink className="h-3.5 w-3.5" aria-hidden />
              </p>
            </div>
          </div>
        </div>
      </Link>
    )
  }

  // Mini: small card (carousel / top listings)
  if (variant === "mini") {
    return (
      <Link href={href} className={cn(CARD_LINK_CLASS, "block group h-full", className)} aria-label={ariaLabel}>
        <div className="h-full overflow-hidden rounded-xl border border-border bg-card shadow-sm hover:shadow-md transition-all duration-200 group-hover:border-primary/20">
          <div className="relative h-44 overflow-hidden bg-gradient-to-br from-primary/5 via-purple-50/60 to-pink-50/50">
            {showPremiumVerified && (
              <div
                className="absolute left-2 top-2 z-10 flex items-center gap-0.5 rounded-full border border-sky-200/80 bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-white shadow-md ring-2 ring-white/90 sm:text-[9px]"
                title="Verified listing"
              >
                <BadgeCheck className="h-3 w-3 shrink-0 text-white sm:h-3.5 sm:w-3.5" strokeWidth={2.5} aria-hidden />
                <span className="pr-0.5">Verified</span>
              </div>
            )}
            {/* Logo badge: make logos feel bigger + consistent (circle). */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-white/95 backdrop-blur-sm shadow-lg ring-2 ring-primary/10 border border-gray-200 overflow-hidden">
                <div className="absolute inset-0 p-4 sm:p-4.5">
                  <BusinessLogo
                    src={logoFor(business, "thumb")}
                    fill
                    sizes="(max-width: 640px) 96px, 112px"
                    className="object-contain transition-opacity group-hover:opacity-90"
                  />
                </div>
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white via-white/95 to-transparent" />
          </div>
          <div className="p-3 sm:p-4">
            <h3 className="font-bold text-sm sm:text-base text-gray-900 group-hover:text-primary transition-colors line-clamp-2 mb-1.5">
              {business.name}
            </h3>
            <span className="inline-block bg-primary/10 text-primary px-2 py-0.5 rounded text-[10px] sm:text-xs font-medium border border-primary/20">
              {business.category}
            </span>
            {(business.city || business.distanceKm != null) && (
              <div className="flex items-center gap-2 text-[10px] sm:text-xs text-gray-600 mt-1.5 pt-1.5 border-t border-gray-100">
                <MapPin className="h-3 w-3 text-primary flex-shrink-0" aria-hidden />
                {business.city && <span className="capitalize font-medium truncate">{business.city}</span>}
                {business.distanceKm != null && <span className="font-medium">{formatDistance(business.distanceKm)}</span>}
              </div>
            )}
            <div className="pt-1.5 flex items-center justify-between">
              <span className="text-[9px] sm:text-[10px] text-gray-500 font-medium">View Details</span>
              <ExternalLink className="h-3 w-3 text-primary opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" aria-hidden />
            </div>
          </div>
        </div>
      </Link>
    )
  }

  // Card: full card (city page, grid views)
  return (
    <Link href={href} className={cn(CARD_LINK_CLASS, "h-full rounded-xl", className)} aria-label={ariaLabel}>
      <div className="relative bg-card border border-border rounded-xl shadow-sm hover:shadow-md transition-all duration-200 p-5 sm:p-6 h-full flex flex-col min-h-[280px] group hover:border-primary/25">
        <div className="flex items-start gap-3 sm:gap-4 mb-3 sm:mb-4">
          <div className="relative w-12 h-12 sm:w-16 sm:h-16 rounded-lg overflow-hidden bg-gray-100 border-2 border-gray-200 flex-shrink-0">
            <BusinessLogo
              src={logoFor(business, "thumb")}
              fill
              sizes="(max-width: 640px) 48px, 64px"
              className="object-contain"
            />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base sm:text-lg text-gray-900 mb-1 line-clamp-2 flex items-center gap-2 flex-wrap">
              <span className="truncate">{business.name}</span>
              {business.status === "pending" && (
                <span className="inline-flex items-center rounded bg-amber-100 text-amber-800 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide whitespace-nowrap">
                  Pending
                </span>
              )}
            </h3>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="bg-primary text-primary-foreground px-2 py-0.5 sm:py-1 rounded text-[10px] sm:text-xs font-medium">
                {business.category}
              </span>
              {(business.city || business.distanceKm != null) && (
                <div className="flex items-center gap-2 text-muted-foreground text-xs sm:text-sm flex-wrap">
                  {business.city && (
                    <>
                      <MapPin className="h-3 w-3 flex-shrink-0" aria-hidden />
                      <span className="line-clamp-1">{business.city}</span>
                    </>
                  )}
                  {business.distanceKm != null && <span className="font-medium text-primary">{formatDistance(business.distanceKm)}</span>}
                </div>
              )}
            </div>
          </div>
        </div>
        {business.description && (
          <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed line-clamp-3 mb-4 flex-1">
            {business.description}
          </p>
        )}
        <p className={cn("mt-auto", VIEW_DETAILS_CLASS)}>
          <span>View Details</span>
          <ExternalLink className="h-4 w-4" aria-hidden />
        </p>
      </div>
    </Link>
  )
}

export const ListingCard = memo(ListingCardInner)
