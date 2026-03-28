"use client"
import React, { useRef, useState, useEffect } from 'react'
import { MapPin, Mail, Star, FileText, Globe, MessageCircle, User, CheckCircle } from "lucide-react"
import { useParams, usePathname } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { BusinessSchema } from "@/components/business-schema"
import { BreadcrumbSchema } from "@/components/breadcrumb-schema"
import { AdSection } from "@/components/ad-section"
import { useToast } from "@/hooks/use-toast"
import { logger } from "@/lib/logger"
import { slugify, whatsappChatUrl } from "@/lib/utils"

export default function BusinessDetailPage({
  initialBusiness,
  initialReviews = [],
  initialRatingAvg = 0,
  initialRatingCount = 0,
  initialRelated = []
}: {
  initialBusiness?: any
  initialReviews?: any[]
  initialRatingAvg?: number
  initialRatingCount?: number
  initialRelated?: any[]
}) {
  const pathname = usePathname()
  const params = useParams() as { id?: string; slug?: string }
  const rawParam = params.id || params.slug || ""
  const businessId = (!rawParam || rawParam === "_placeholder")
    ? (pathname.replace(/^\/+/, '').split('/').filter(Boolean).pop() || "")
    : rawParam
  const [business, setBusiness] = useState<any>(initialBusiness || null)
  const [reviews, setReviews] = useState<any[]>(initialReviews)
  const [related, setRelated] = useState<any[]>(initialRelated)
  const [recentBusinesses, setRecentBusinesses] = useState<any[]>([])
  const [ratingAvg, setRatingAvg] = useState(initialRatingAvg)
  const [ratingCount, setRatingCount] = useState(initialRatingCount)
  const [loading, setLoading] = useState(!initialBusiness)
  const [openReview, setOpenReview] = useState(false)
  const [reviewerName, setReviewerName] = useState('')
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewComment, setReviewComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [reviewError, setReviewError] = useState<string | null>(null)
  const [showAllReviews, setShowAllReviews] = useState(false)
  const [showFullDescription, setShowFullDescription] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const fetchBusiness = async () => {
      if (initialBusiness) return
      if (!businessId) return

      try {
        setLoading(true)
        setBusiness(null)
        // Always use same-origin API path in browser to satisfy CSP.
        const url = `/api/business/${encodeURIComponent(businessId)}`
        const response = await fetch(url)
        const data = await response.json().catch(() => ({}))
        if (response.ok && data?.business != null && data?.ok !== false) {
          setBusiness(data.business)
        } else {
          setBusiness(null)
        }
      } catch (error) {
        logger.error("Error fetching business:", error)
        setBusiness(null)
      } finally {
        setLoading(false)
      }
    }

    if (businessId && !initialBusiness) {
      fetchBusiness()
    }
  }, [businessId, initialBusiness])

  // Fetch existing reviews
  useEffect(() => {
    const fetchReviews = async () => {
      if (!business) return
      
      try {
        const businessIdParam = business._id || business.id || businessId
        const response = await fetch(`/api/reviews?businessId=${encodeURIComponent(businessIdParam)}`)
        if (response.ok) {
          const data = await response.json()
          if (data.ok) {
            setReviews(data.reviews || [])
            setRatingAvg(data.ratingAvg || 0)
            setRatingCount(data.ratingCount || 0)
          }
        }
      } catch (error) {
        logger.error('Error fetching reviews:', error)
      }
    }

    if (business && reviews.length === 0) {
      fetchReviews()
    }
  }, [business, businessId])

  // Fetch related and recent businesses
  useEffect(() => {
    const fetchRelatedBusinesses = async () => {
      if (!business) return
      
      try {
        // Fetch businesses in same category
        const relatedResponse = await fetch(`/api/business?category=${encodeURIComponent(business.category)}&limit=8`)
        if (relatedResponse.ok) {
          const relatedData = await relatedResponse.json()
          if (relatedData.ok && relatedData.businesses) {
            // Filter out current business
            const filteredRelated = relatedData.businesses.filter((b: any) => 
              b.slug !== business.slug && b._id !== business._id
            )
            setRelated(filteredRelated)
          }
        }

        // Fetch recent businesses
        const recentResponse = await fetch(`/api/business?limit=8`)
        if (recentResponse.ok) {
          const recentData = await recentResponse.json()
          if (recentData.ok && recentData.businesses) {
            // Filter out current business
            const filteredRecent = recentData.businesses.filter((b: any) => 
              b.slug !== business.slug && b._id !== business._id
            )
            setRecentBusinesses(filteredRecent)
          }
        }
      } catch (error) {
        logger.error('Error fetching related businesses:', error)
      }
    }

    if (business) {
      fetchRelatedBusinesses()
    }
  }, [business])

  const handleSubmitReview = async () => {
    if (reviewComment.trim().length < 3) return
    setReviewError(null)
    setSubmitting(true)
    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: business?._id || business?.id || businessId,
          name: reviewerName.trim() || 'Anonymous',
          rating: reviewRating,
          comment: reviewComment.trim()
        })
      })
      
      const result = await response.json()
      if (response.ok && result.ok) {
        const newReview = {
          name: reviewerName.trim() || 'Anonymous',
          rating: reviewRating,
          comment: reviewComment.trim(),
          createdAt: new Date().toISOString()
        }
        setReviews(prev => [newReview, ...prev])
        setRatingCount(prev => prev + 1)
        setRatingAvg(prev => ((prev * ratingCount) + reviewRating) / (ratingCount + 1))
        setReviewerName('')
        setReviewRating(5)
        setReviewComment('')
        setReviewError(null)
        setOpenReview(false)
        toast({
          title: 'Review posted',
          description: 'Thank you. Your review has been added.',
        })
      } else {
        logger.error('Review submission failed:', result)
        const message = 'Couldn’t post your review. Please try again.'
        setReviewError(message)
        toast({ title: 'Review not posted', description: message, variant: 'destructive' })
      }
    } catch (error) {
      logger.error('Error submitting review:', error)
      const message = 'Check your connection and try again.'
      setReviewError(message)
      toast({ title: 'Something went wrong', description: message, variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Loading business details...</p>
      </div>
    )
  }

  if (!business) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Business Not Found</h1>
          <p className="text-gray-600 mb-6">The business you're looking for doesn't exist or the link may be incorrect.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild>
              <Link href="/search">Back to Search</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/">Home</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const categorySlug = business.category ? slugify(business.category) : "";
  const businessUrl = `/${business.slug || businessId}`;
  const breadcrumbItems = [
    { name: "Home", url: "/" },
    ...(categorySlug ? [{ name: business.category || categorySlug, url: `/category/${categorySlug}` }] : []),
    { name: business.name, url: businessUrl },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <BusinessSchema business={business} ratingAvg={ratingAvg} ratingCount={ratingCount} />
      <BreadcrumbSchema items={breadcrumbItems} />

      {/* Header Section */}
      <div className="flex flex-col md:flex-row gap-8 items-start">
        {/* Logo */}
        <div className="w-40 h-40 relative border rounded-lg overflow-hidden bg-white">
          <Image
            src={business.logoUrl || "/placeholder.svg"}
            alt={`${business.name} – ${business.category || "Business"} in ${business.city || "Pakistan"}`}
            fill
            className="object-contain p-2"
            sizes="160px"
            onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg" }}
          />
        </div>

        {/* Info - H1: business name + location for SEO */}
        <div className="flex-1">
          <h1 className="text-3xl font-bold mb-2">
            {business.name}
            {business.city && (
              <span className="font-normal text-gray-600 text-xl sm:text-2xl ml-2">
                in {business.city}, Pakistan
              </span>
            )}
          </h1>

          {/* Rating */}
          <div className="flex items-center gap-1 mb-2">
            <span className="text-sm text-gray-600">
              Rating {ratingCount > 0 ? ratingAvg.toFixed(1) : '0.0'}
            </span>
            {[...Array(5)].map((_, i) => (
              <Star 
                key={i} 
                className={`w-4 h-4 ${
                  i < Math.floor(ratingAvg) 
                    ? 'fill-yellow-400 text-yellow-400' 
                    : 'text-gray-300'
                }`} 
              />
            ))}
          </div>

          <p className="text-sm text-gray-500 mb-4">
            {business.category && (
              <>
                <Link href={`/category/${slugify(business.category as string)}`} className="text-primary hover:underline font-medium">
                  {business.category}
                </Link>
                {" • "}
              </>
            )}
            {business.city && (
              <Link href={`/city/${slugify(business.city as string)}`} className="text-primary hover:underline font-medium">
                {business.city}
              </Link>
            )}
            {!business.city && "Pakistan"}
          </p>

          {/* Trust: verified badge */}
          {business.status === "approved" && (
            <p className="flex items-center gap-2 text-sm text-emerald-600 mb-4">
              <CheckCircle className="h-4 w-4 shrink-0" aria-hidden />
              <span>Listed on BizBranches</span>
            </p>
          )}

          {/* Primary CTAs: WhatsApp (no tel), Visit Website – above the fold, mobile-friendly */}
          <div className="flex flex-wrap gap-2 sm:gap-3">
            {business.phone && (
              <a
                href={whatsappChatUrl(String(business.phone))}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-3 rounded-lg bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-700 transition-colors min-h-[44px]"
              >
                <MessageCircle className="h-4 w-4 shrink-0" /> WhatsApp
              </a>
            )}
            {business.whatsapp && (
              <a
                href={`https://wa.me/${(business.whatsapp as string).replace(/[^0-9]/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-3 rounded-lg bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-700 transition-colors min-h-[44px]"
              >
                <MessageCircle className="h-4 w-4 shrink-0" /> WhatsApp
              </a>
            )}
            {business.websiteUrl && (
              <a
                href={String(business.websiteUrl).startsWith("http") ? business.websiteUrl : `https://${business.websiteUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-3 rounded-lg border-2 border-primary text-primary font-semibold text-sm hover:bg-primary/10 transition-colors min-h-[44px]"
              >
                <Globe className="h-4 w-4 shrink-0" /> Visit Website
              </a>
            )}
            <Button variant="outline" size="lg" onClick={() => setOpenReview(true)} className="min-h-[44px]">
              <FileText className="h-4 w-4 mr-2" /> Add a Review
            </Button>
            {business.address && (
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent([business.address, business.city].filter(Boolean).join(", "))}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-3 rounded-lg border border-gray-300 font-medium text-sm hover:bg-gray-50 transition-colors min-h-[44px]"
              >
                <MapPin className="h-4 w-4 shrink-0" /> Get Directions
              </a>
            )}
          </div>
        </div>
      </div>

      {/* H2: About business */}
      {business.description && (
        <section className="mt-6 sm:mt-8" aria-labelledby="about-heading">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3 bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <h2 id="about-heading" className="text-xl font-bold text-gray-800 mb-4">About {business.name}</h2>
              <div className="border-t border-gray-100 pt-4">
                <p className={`text-gray-700 leading-relaxed whitespace-pre-line ${!showFullDescription ? 'line-clamp-4' : ''}`}>
                  {business.description}
                </p>
                {business.description.length > 200 && (
                  <button 
                    onClick={() => setShowFullDescription(!showFullDescription)}
                    className="mt-3 text-blue-600 hover:text-blue-800 font-medium text-sm"
                  >
                    {showFullDescription ? 'Show Less' : 'Read More'}
                  </button>
                )}
              </div>
            </div>

            <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <h2 id="location-heading" className="text-lg font-bold text-gray-800 p-4 pb-0">Location</h2>
              <div className="h-64 relative p-4 pt-2">
                <iframe
                  src={`https://maps.google.com/maps?q=${encodeURIComponent((business.address || "") + ", " + (business.city || ""))}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="w-full h-full"
                  title="Map location"
                />
              </div>
              <div className="p-4 bg-gray-50">
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent([business.address, business.city].filter(Boolean).join(", "))}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-primary hover:underline font-medium text-sm"
                >
                  <MapPin className="w-4 h-4" />
                  Open in Google Maps
                </a>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* H2: Contact & Location (sidebar) + Reviews */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-6 sm:mt-8">
        <div className="lg:col-span-2">
          <h2 className="text-2xl font-semibold mb-6">Customer Reviews</h2>
          
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
              <span className="text-lg font-semibold">
                {ratingCount > 0 ? ratingAvg.toFixed(1) : '0.0'}
              </span>
              <span className="text-gray-600">
                ({ratingCount} review{ratingCount !== 1 ? 's' : ''})
              </span>
            </div>
            <Button 
              onClick={() => setOpenReview(true)} 
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 text-base font-semibold shadow-lg"
              size="lg"
            >
              <FileText className="w-5 h-5 mr-2" />
              Write a Review
            </Button>
          </div>

          <div className="space-y-4">
            {/* Always show real reviews first */}
            {(showAllReviews ? reviews : reviews.slice(0, 3)).map((review, idx) => (
              <div key={idx} className="bg-white border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-semibold">{review.name || 'Anonymous'}</span>
                  <span className="text-sm text-gray-500">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-1 mb-2">
                  {[1,2,3,4,5].map(n => (
                    <Star 
                      key={n} 
                      className={`h-4 w-4 ${
                        n <= review.rating 
                          ? 'fill-yellow-400 text-yellow-400' 
                          : 'text-gray-300'
                      }`} 
                    />
                  ))}
                </div>
                <p className="text-gray-700">{review.comment}</p>
              </div>
            ))}

            {/* Show dummy reviews as fillers if less than 3 real reviews and not showing all */}
            {!showAllReviews && reviews.length < 3 && (
              <>
                {reviews.length === 0 && (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-dashed border-blue-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium text-blue-700">Sample Reviews (Will be replaced with real reviews)</span>
                    </div>
                  </div>
                )}
                
                {/* Dummy Review 1 - Show if less than 1 real review */}
                {reviews.length < 1 && (
                  <div className="bg-white border rounded-lg p-4 opacity-75">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-semibold text-gray-600">Sarah Johnson</span>
                      <span className="text-sm text-gray-400">Sample Review</span>
                    </div>
                    <div className="flex items-center gap-1 mb-2">
                      {[1,2,3,4,5].map(n => (
                        <Star 
                          key={n} 
                          className={`h-4 w-4 ${
                            n <= 5 
                              ? 'fill-yellow-400 text-yellow-400' 
                              : 'text-gray-300'
                          }`} 
                        />
                      ))}
                    </div>
                    <p className="text-gray-600 italic">"Excellent service and professional staff. Highly recommend this business to anyone looking for quality service. Will definitely come back!"</p>
                  </div>
                )}

                {/* Dummy Review 2 - Show if less than 2 real reviews */}
                {reviews.length < 2 && (
                  <div className="bg-white border rounded-lg p-4 opacity-75">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-semibold text-gray-600">Mike Chen</span>
                      <span className="text-sm text-gray-400">Sample Review</span>
                    </div>
                    <div className="flex items-center gap-1 mb-2">
                      {[1,2,3,4,5].map(n => (
                        <Star 
                          key={n} 
                          className={`h-4 w-4 ${
                            n <= 4 
                              ? 'fill-yellow-400 text-yellow-400' 
                              : 'text-gray-300'
                          }`} 
                        />
                      ))}
                    </div>
                    <p className="text-gray-600 italic">"Great experience overall. The team was knowledgeable and helpful. Good value for money and timely service delivery."</p>
                  </div>
                )}

                {/* Dummy Review 3 - Show if less than 3 real reviews */}
                <div className="bg-white border rounded-lg p-4 opacity-75">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-semibold text-gray-600">Emma Wilson</span>
                    <span className="text-sm text-gray-400">Sample Review</span>
                  </div>
                  <div className="flex items-center gap-1 mb-2">
                    {[1,2,3,4,5].map(n => (
                      <Star 
                        key={n} 
                        className={`h-4 w-4 ${
                          n <= 5 
                            ? 'fill-yellow-400 text-yellow-400' 
                            : 'text-gray-300'
                        }`} 
                      />
                    ))}
                  </div>
                  <p className="text-gray-600 italic">"Outstanding customer service! They went above and beyond to meet our needs. Professional, reliable, and friendly staff."</p>
                </div>

                <div className="text-center mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-700 font-medium">👆 Sample reviews shown as placeholders</p>
                  <p className="text-xs text-yellow-600 mt-1">{reviews.length === 0 ? 'Be the first to leave a real review!' : `${3 - reviews.length} more real reviews needed to fill this section`}</p>
                </div>
              </>
            )}

            {/* Read More / Show Less Button */}
            {reviews.length > 3 && (
              <div className="text-center mt-6">
                <Button 
                  variant="outline" 
                  onClick={() => setShowAllReviews(!showAllReviews)}
                  className="px-6 py-2"
                >
                  {showAllReviews ? `Show Less Reviews` : `Read More Reviews (${reviews.length - 3} more)`}
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* H2: Contact & Location – sidebar NAP */}
        <div className="lg:col-span-1" itemScope itemType="https://schema.org/LocalBusiness">
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-900">Contact & Location</h2>
              <p className="text-sm text-gray-600 mb-4" itemProp="name">{business.name}</p>
              
              <div className="space-y-4">
                {/* 1. Address (NAP - first in sidebar for consistency) */}
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <MapPin className="h-5 w-5 text-gray-600 mt-0.5 flex-shrink-0" aria-hidden />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm">Address</p>
                    <p className="text-sm text-gray-700 mt-0.5" itemProp="address" itemScope itemType="https://schema.org/PostalAddress">
                      <span itemProp="streetAddress">{business.address || "—"}</span>
                      {business.city && (
                        <>, <span itemProp="addressLocality" className="capitalize">{business.city}</span></>
                      )}
                      {business.postalCode && (
                        <> <span itemProp="postalCode">{business.postalCode}</span></>
                      )}
                    </p>
                  </div>
                  <a 
                    href={`https://maps.google.com/?q=${encodeURIComponent([business.address, business.city].filter(Boolean).join(", "))}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary/80 font-medium text-sm flex-shrink-0"
                  >
                    Map
                  </a>
                </div>

                {/* 2. Phone (NAP - second in sidebar) */}
                {business.phone && (
                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-100">
                    <MessageCircle className="h-5 w-5 text-green-600 flex-shrink-0" aria-hidden />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm">WhatsApp</p>
                      <p className="text-sm text-gray-700 mt-0.5" itemProp="telephone">{business.phone}</p>
                    </div>
                    <a
                      href={whatsappChatUrl(String(business.phone))}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-600 hover:text-green-800 font-medium text-sm flex-shrink-0"
                    >
                      Chat
                    </a>
                  </div>
                )}

                {/* WhatsApp */}
                {business.whatsapp && (
                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                    <MessageCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm">WhatsApp</p>
                      <p className="text-sm text-gray-600">{business.whatsapp}</p>
                    </div>
                    <a 
                      href={`https://wa.me/${business.whatsapp.replace(/[^0-9]/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-600 hover:text-green-800 font-medium text-sm flex-shrink-0"
                    >
                      Chat
                    </a>
                  </div>
                )}

                {/* Email */}
                {business.email && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Mail className="h-5 w-5 text-gray-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm">Email</p>
                      <p className="text-sm text-gray-600 break-all">{business.email}</p>
                    </div>
                    <a 
                      href={`mailto:${business.email}`}
                      className="text-gray-600 hover:text-gray-800 font-medium text-sm flex-shrink-0"
                    >
                      Email
                    </a>
                  </div>
                )}

                {/* Website */}
                {business.websiteUrl && (
                  <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                    <Globe className="h-5 w-5 text-purple-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm">Website</p>
                      <p className="text-sm text-gray-600 truncate">{business.websiteUrl}</p>
                    </div>
                    <a 
                      href={business.websiteUrl.startsWith("http") ? business.websiteUrl : `https://${business.websiteUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-600 hover:text-purple-800 font-medium text-sm flex-shrink-0"
                    >
                      Visit
                    </a>
                  </div>
                )}

                {/* Contact Person */}
                {business.contactPerson && (
                  <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                    <User className="h-5 w-5 text-orange-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm">Contact Person</p>
                      <p className="text-sm text-gray-600">{business.contactPerson}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Ad below main content – non-intrusive */}
      <AdSection slotId="business-center-ad" className="mt-8 mb-8" />

      {/* Internal links: same city, same category */}
      <section className="mt-8">
        <h2 className="text-2xl font-semibold mb-6">
          Recently Added Businesses
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {recentBusinesses.slice(0, 5).map((recentBusiness, index) => (
            <Link
              key={recentBusiness.id || recentBusiness._id || index}
              href={`/${recentBusiness.slug || recentBusiness._id}`}
              className="border rounded-lg overflow-hidden hover:shadow-lg transition bg-white block"
            >
              <div className="relative h-24 bg-gray-50">
                <Image
                  src={recentBusiness.logoUrl || "/placeholder.svg"}
                  alt={recentBusiness.name}
                  fill
                  className="object-contain p-2"
                />
              </div>

              <div className="p-3">
                <h3 className="font-semibold text-sm mb-1 line-clamp-2">
                  {recentBusiness.name}
                </h3>
                <p className="text-xs text-gray-500 mb-2">
                  {recentBusiness.category}
                </p>
                <span className="text-red-500 text-xs font-medium hover:underline">
                  View Details →
                </span>
              </div>
            </Link>
          ))}
        </div>

        {recentBusinesses.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            Loading recent businesses...
          </div>
        )}
      </section>

      {/* Similar Businesses - fully clickable cards */}
      {related.length > 0 && (
        <section className="mt-10">
          <h2 className="text-2xl font-semibold mb-6">
            Similar Businesses in {business.category}
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {related.slice(0, 5).map((relatedBusiness, index) => (
              <Link
                key={relatedBusiness.id || relatedBusiness._id || index}
                href={`/${relatedBusiness.slug || relatedBusiness._id}`}
                className="border rounded-lg overflow-hidden hover:shadow-lg transition bg-white block focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                aria-label={`View ${relatedBusiness.name}`}
              >
                <div className="relative h-24 bg-gray-50">
                  <Image
                    src={relatedBusiness.logoUrl || "/placeholder.svg"}
                    alt=""
                    fill
                    className="object-contain p-2"
                  />
                </div>
                <div className="p-3">
                  <h3 className="font-semibold text-sm mb-1 line-clamp-2">
                    {relatedBusiness.name}
                  </h3>
                  <p className="text-xs text-gray-500 mb-2">
                    {relatedBusiness.category}
                  </p>
                  <span className="text-primary text-xs font-medium">
                    View Details →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Review Dialog */}
      <Dialog open={openReview} onOpenChange={(open) => { setOpenReview(open); if (!open) setReviewError(null); }}>
        <DialogContent aria-describedby={reviewError ? "review-error" : undefined}>
          <DialogHeader>
            <DialogTitle>Leave a Review</DialogTitle>
            <DialogDescription>Share your experience with {business.name}. Your comment must be at least 3 characters.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {reviewError && (
              <p id="review-error" className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3" role="alert">
                {reviewError}
              </p>
            )}
            <div>
              <Label htmlFor="review-name">Your Name</Label>
              <Input 
                id="review-name" 
                placeholder="Optional" 
                value={reviewerName} 
                onChange={e => { setReviewerName(e.target.value); setReviewError(null); }} 
                className="min-h-[44px]"
                aria-describedby="review-name-hint"
              />
              <p id="review-name-hint" className="text-xs text-muted-foreground mt-1">Leave blank to post as Anonymous</p>
            </div>
            <div>
              <Label id="review-rating-label">Rating</Label>
              <div className="flex items-center gap-1 mt-1" role="group" aria-labelledby="review-rating-label">
                {[1,2,3,4,5].map(n => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setReviewRating(n)}
                    className="p-2 rounded-lg hover:bg-gray-100 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary min-h-[44px] min-w-[44px] flex items-center justify-center"
                    aria-label={`Rate ${n} star${n === 1 ? '' : 's'}`}
                    aria-pressed={reviewRating === n}
                  >
                    <Star className={`h-6 w-6 ${n <= reviewRating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                  </button>
                ))}
                <span className="text-sm text-muted-foreground ml-2">{reviewRating} / 5</span>
              </div>
            </div>
            <div>
              <Label htmlFor="review-comment">Comment</Label>
              <Textarea 
                id="review-comment" 
                placeholder="Write your review (at least 3 characters)..." 
                value={reviewComment} 
                onChange={e => { setReviewComment(e.target.value); setReviewError(null); }} 
                rows={4} 
                className="min-h-[44px]"
                aria-invalid={reviewComment.trim().length > 0 && reviewComment.trim().length < 3}
                aria-describedby="review-comment-hint"
              />
              <p id="review-comment-hint" className="text-xs text-muted-foreground mt-1">{reviewComment.length} characters (min 3)</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenReview(false)} disabled={submitting} className="min-h-[44px]">
              Cancel
            </Button>
            <Button onClick={handleSubmitReview} disabled={submitting || reviewComment.trim().length < 3} className="min-h-[44px] min-w-[120px]" aria-busy={submitting}>
              {submitting ? 'Submitting…' : 'Submit'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}