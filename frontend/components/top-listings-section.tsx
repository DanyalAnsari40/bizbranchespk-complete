"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ListingCard } from "@/components/listing-card"
import { Star, TrendingUp, ArrowRight, Sparkles, ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"
import useEmblaCarousel from "embla-carousel-react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { categories, mockBusinesses } from "@/lib/mock-data"

type FeaturedCategoryCardProps = {
  categoryName: string
  categorySlug: string
}

function toListingBusiness(b: { id: string; slug?: string; name: string; category: string; city?: string; image?: string }) {
  return { id: b.id, slug: b.slug ?? b.id, name: b.name, category: b.category, city: b.city, image: b.image }
}

function FeaturedCategoryCard({ categoryName, categorySlug }: FeaturedCategoryCardProps) {
  const list = useMemo(
    () => mockBusinesses.filter((b) => b.category.toLowerCase() === categoryName.toLowerCase()),
    [categoryName],
  )

  const meta = useMemo(() => categories.find((c) => c.slug === categorySlug), [categorySlug])

  const [index, setIndex] = useState(0)
  const [anim, setAnim] = useState(true)

  useEffect(() => {
    setAnim(true)
    if (list.length <= 1) return
    const id = setInterval(() => {
      setAnim(false)
      setIndex((i) => (i + 1) % list.length)
      requestAnimationFrame(() => setAnim(true))
    }, 4000)
    return () => clearInterval(id)
  }, [list.length])

  const first = list.length > 0 ? list[index % list.length] : undefined
  const second = list.length > 0 ? list[(index + 1) % list.length] : undefined

  return (
    <Card className="h-full border-0 shadow-xl bg-gradient-to-br from-white to-gray-50/50 overflow-hidden">
      <div className="bg-gradient-to-r from-primary/10 via-purple-50/50 to-pink-50/50 p-6 border-b border-primary/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg">
              <span className="text-2xl" aria-hidden>{meta?.icon ?? "⭐"}</span>
            </div>
            <div>
              <h3 className="text-xl font-bold bg-gradient-to-r from-primary via-purple-600 to-pink-600 bg-clip-text text-transparent">
                {categoryName}
              </h3>
              {meta?.count ? (
                <p className="text-xs text-gray-600 font-medium mt-1">{meta.count} listings available</p>
              ) : null}
            </div>
          </div>
          <Link href={`/category/${categorySlug}`}>
            <Button variant="ghost" size="sm" className="text-xs font-semibold hover:bg-primary/10 hover:text-primary">
              View all
              <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </Link>
        </div>
      </div>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {first ? (
            <div className={`transition-all duration-500 ${anim ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'}`} key={`b1-${first.id}`}>
              <ListingCard business={toListingBusiness(first)} variant="mini" showPremiumVerified />
            </div>
          ) : (
            <div className="flex items-center justify-center h-48 text-sm text-gray-400 bg-gray-50 rounded-lg">
              No businesses yet.
            </div>
          )}
          {second && (
            <div className={`transition-all duration-500 ${anim ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'}`} key={`b2-${second.id}`}>
              <ListingCard business={toListingBusiness(second)} variant="mini" showPremiumVerified />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function mapFeatured(b: any) {
  return {
    id: String(b._id || b.id || b.slug || b.name),
    slug: b.slug ?? String(b._id || b.id),
    name: b.name,
    category: b.category,
    city: (b.city || '').toLowerCase(),
    image: b.logoUrl || b.image || '/placeholder.svg',
  }
}

export function TopListingsSection({ initialRecent = [] }: { initialRecent?: any[] }) {
  const initialMapped = useMemo(
    () => (Array.isArray(initialRecent) ? initialRecent.map(mapFeatured) : []),
    [initialRecent]
  )
  const [listings, setListings] = useState<(typeof mockBusinesses)[number][]>(initialMapped)
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/business/recent?limit=12`, { cache: "no-store" })
        const json = await res.json()
        if (json?.ok && Array.isArray(json.businesses) && json.businesses.length > 0) {
          setListings(json.businesses.map(mapFeatured))
        }
      } catch {}
    }
    load()
  }, [])
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    loop: true, 
    align: "start",
    duration: 20,
    dragFree: false,
  })
  const autoplayRef = useRef<NodeJS.Timeout | null>(null)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)
  const [canScrollPrev, setCanScrollPrev] = useState(false)
  const [canScrollNext, setCanScrollNext] = useState(false)

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev()
  }, [emblaApi])

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext()
  }, [emblaApi])

  const play = useCallback(() => {
    if (!emblaApi || !isPlaying) return
    autoplayRef.current && clearInterval(autoplayRef.current)
    autoplayRef.current = setInterval(() => {
      if (emblaApi) {
        emblaApi.scrollNext()
      }
    }, 4000) // Auto-rotate every 4 seconds
  }, [emblaApi, isPlaying])

  const pause = useCallback(() => {
    if (autoplayRef.current) {
      clearInterval(autoplayRef.current)
      autoplayRef.current = null
    }
  }, [])

  const onSelect = useCallback(() => {
    if (!emblaApi) return
    setSelectedIndex(emblaApi.selectedScrollSnap())
    setCanScrollPrev(emblaApi.canScrollPrev())
    setCanScrollNext(emblaApi.canScrollNext())
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    emblaApi.on('select', onSelect)
    onSelect()
    if (isPlaying) {
      play()
    }
    return () => {
      pause()
      emblaApi.off('select', onSelect)
    }
  }, [emblaApi, onSelect, isPlaying, play, pause])

  return (
    <section className="py-12 sm:py-16 md:py-20 bg-gradient-to-b from-white via-gray-50/30 to-white relative overflow-hidden" dir="ltr">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-12 max-w-7xl relative z-10">
        {/* Header Section */}
        <div className="text-center mb-8 sm:mb-10 md:mb-12">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-primary/10 to-purple-500/10 border border-primary/20 rounded-full px-3 py-1.5 sm:px-4 sm:py-2 mb-4 sm:mb-5">
            <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
            <span className="text-xs sm:text-sm font-semibold text-primary">Recent Listings</span>
            <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500 animate-pulse" />
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 mb-3 sm:mb-4 md:mb-5">
            Our <span className="bg-gradient-to-r from-primary via-purple-600 to-pink-600 bg-clip-text text-transparent">Top Listings</span>
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed px-4">
            Browse the latest businesses added to our directory across Pakistan.
          </p>
        </div>

        {/* Recent Listings Carousel */}
        {listings.length > 0 && (() => {
          const pairs: typeof listings[] = []
          for (let i = 0; i < listings.length; i += 2) {
            pairs.push(listings.slice(i, i + 2))
          }
          return (
            <div className="mb-8 sm:mb-10">
              <div 
                className="relative overflow-hidden rounded-xl sm:rounded-2xl group" 
                ref={emblaRef} 
                onMouseEnter={() => {
                  pause()
                  setIsPlaying(false)
                }} 
                onMouseLeave={() => {
                  setIsPlaying(true)
                  play()
                }}
              >
                {/* Navigation Arrows */}
                <div className="absolute left-4 top-1/2 -translate-y-1/2 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <button
                    onClick={scrollPrev}
                    disabled={!canScrollPrev}
                    className="w-12 h-12 rounded-full bg-white/90 backdrop-blur-sm shadow-xl border border-gray-200 flex items-center justify-center hover:bg-white hover:shadow-2xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Previous slide"
                  >
                    <ChevronLeft className="h-6 w-6 text-gray-700" />
                  </button>
                </div>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <button
                    onClick={scrollNext}
                    disabled={!canScrollNext}
                    className="w-12 h-12 rounded-full bg-white/90 backdrop-blur-sm shadow-xl border border-gray-200 flex items-center justify-center hover:bg-white hover:shadow-2xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Next slide"
                  >
                    <ChevronRight className="h-6 w-6 text-gray-700" />
                  </button>
                </div>

                {/* Carousel Container */}
                <div className="flex gap-6 items-stretch">
                  {pairs.map((pair, idx) => (
                    <div key={idx} className="min-w-0 flex-[0_0_100%] md:flex-[0_0_50%] lg:flex-[0_0_33.333%]">
                      <div className="bg-gradient-to-br from-white to-gray-50/50 rounded-xl sm:rounded-2xl border-0 shadow-xl p-3 sm:p-4 md:p-5 min-h-[400px] sm:min-h-[450px] md:min-h-[480px] flex flex-col mx-1 sm:mx-2">
                        <div className="mb-3 sm:mb-4 flex items-center justify-between pb-2 sm:pb-3 border-b border-gray-200">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg">
                              <Star className="h-4 w-4 text-white fill-white" />
                            </div>
                            <div>
                              <p className="text-xs font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                                Premium Listings
                              </p>
                              <p className="text-[10px] text-gray-500 font-medium">Handpicked for you</p>
                            </div>
                          </div>
                          <Link href="/search">
                            <Button variant="ghost" size="sm" className="text-[10px] font-semibold hover:bg-primary/10 hover:text-primary h-7 px-2">
                              View all
                              <ArrowRight className="h-2.5 w-2.5 ml-1" />
                            </Button>
                          </Link>
                        </div>
                        <div className="grid grid-cols-1 gap-3 sm:gap-4 flex-1">
                          {pair.map((b, pairItemIndex) => (
                            <ListingCard
                              key={`${String(b.slug ?? b.id)}-${idx}-${pairItemIndex}`}
                              business={toListingBusiness(b)}
                              variant="mini"
                              showPremiumVerified
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Auto-play indicator */}
                {isPlaying && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
                    <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-lg border border-gray-200">
                      <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                      <span className="text-xs text-gray-600 font-medium">Auto-rotating</span>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Enhanced Navigation Dots */}
              <div className="mt-8 flex justify-center items-center gap-3">
                {pairs.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    aria-label={`Go to slide ${i + 1}`}
                    onClick={() => {
                      emblaApi?.scrollTo(i)
                      setIsPlaying(false)
                      pause()
                      setTimeout(() => {
                        setIsPlaying(true)
                        play()
                      }, 5000)
                    }}
                    className={`rounded-full transition-all duration-300 ${
                      selectedIndex === i 
                        ? 'w-8 h-3 bg-gradient-to-r from-primary to-purple-600 shadow-lg' 
                        : 'w-3 h-3 bg-gray-300 hover:bg-gray-400'
                    }`}
                  />
                ))}
              </div>
            </div>
          )
        })()}

        {/* Fallback - Show Different Dummy Businesses */}
        {listings.length === 0 && (() => {
          // Use different businesses from mock data (excluding the ones already shown)
          const fallbackBusinesses = [
            {
              id: "13",
              name: "Golden Pharmacy",
              category: "Healthcare",
              city: "karachi",
              phone: "+92-21-98765432",
              image: "/modern-hospital.webp",
            },
            {
              id: "14",
              name: "Elite Fashion Boutique",
              category: "Retail",
              city: "lahore",
              phone: "+92-42-98765432",
              image: "/placeholder.svg",
            },
            {
              id: "15",
              name: "Smart Learning Academy",
              category: "Education",
              city: "islamabad",
              phone: "+92-51-87654321",
              image: "/school-building-with-playground.webp",
            },
            {
              id: "16",
              name: "Luxury Auto Showroom",
              category: "Automotive",
              city: "rawalpindi",
              phone: "+92-51-76543210",
              image: "/car-repair-garage.webp",
            },
            {
              id: "17",
              name: "Royal Beauty Salon",
              category: "Beauty & Spa",
              city: "faisalabad",
              phone: "+92-41-65432109",
              image: "/modern-beauty-salon.png",
            },
            {
              id: "18",
              name: "Premium Realty Group",
              category: "Real Estate",
              city: "multan",
              phone: "+92-61-54321098",
              image: "/local-business-directory-city-buildings.webp",
            },
          ]

          const pairs: typeof fallbackBusinesses[] = []
          for (let i = 0; i < fallbackBusinesses.length; i += 2) {
            pairs.push(fallbackBusinesses.slice(i, i + 2))
          }

          return (
            <div className="mb-8 sm:mb-10">
              <div className="relative overflow-hidden rounded-xl sm:rounded-2xl group">
                <div className="flex gap-6 items-stretch overflow-x-auto snap-x snap-mandatory scrollbar-hide">
                  {pairs.map((pair, idx) => (
                    <div key={idx} className="min-w-0 flex-[0_0_100%] md:flex-[0_0_50%] lg:flex-[0_0_33.333%] snap-start">
                      <div className="bg-gradient-to-br from-white to-gray-50/50 rounded-xl sm:rounded-2xl border-0 shadow-xl p-3 sm:p-4 md:p-5 min-h-[400px] sm:min-h-[450px] md:min-h-[480px] flex flex-col mx-1 sm:mx-2">
                        <div className="mb-3 sm:mb-4 flex items-center justify-between pb-2 sm:pb-3 border-b border-gray-200">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg">
                              <Star className="h-4 w-4 text-white fill-white" />
                            </div>
                            <div>
                              <p className="text-xs font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                                Premium Listings
                              </p>
                              <p className="text-[10px] text-gray-500 font-medium">Handpicked for you</p>
                            </div>
                          </div>
                          <Link href="/search">
                            <Button variant="ghost" size="sm" className="text-[10px] font-semibold hover:bg-primary/10 hover:text-primary h-7 px-2">
                              View all
                              <ArrowRight className="h-2.5 w-2.5 ml-1" />
                            </Button>
                          </Link>
                        </div>
                        <div className="grid grid-cols-1 gap-3 sm:gap-4 flex-1">
                          {pair.map((b, pairItemIndex) => (
                            <ListingCard key={`fb-${String(b.slug ?? b.id)}-${idx}-${pairItemIndex}`} business={toListingBusiness(b)} variant="mini" />
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )
        })()}

        {/* CTA Section */}
        <div className="text-center mt-8 sm:mt-10 md:mt-12">
          <div className="inline-flex flex-col items-center gap-3 sm:gap-4">
            <Link href="/search">
              <Button size="lg" className="px-6 sm:px-8 md:px-10 py-4 sm:py-5 md:py-6 text-sm sm:text-base font-semibold">
                <span>Explore All Listings</span>
                <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 ml-2" />
                <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 ml-1 hidden sm:inline" />
              </Button>
            </Link>
            <p className="text-xs sm:text-sm text-gray-500">
              Join thousands of businesses already listed
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
