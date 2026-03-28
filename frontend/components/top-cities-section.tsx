'use client'

import { Card } from "@/components/ui/card"
import { logger } from "@/lib/logger"
import Link from "next/link"
import { MapPin, Building2, ArrowRight } from "lucide-react"
import { useState, useEffect } from "react"

interface City {
  id: string
  name: string
}

interface TopCity extends City {
  slug: string
  businesses: number
  image: string
  description: string
}

const cityDescriptions: Record<string, { businesses: number; image: string; description: string }> = {
  "karachi": {
    businesses: 3200,
    image: "/karachi-skyline-with-modern-buildings.webp",
    description: "Pakistan's largest commercial hub"
  },
  "lahore": {
    businesses: 2800,
    image: "/lahore-historical-architecture-and-modern-city.webp",
    description: "Cultural capital with thriving businesses"
  },
  "islamabad": {
    businesses: 1900,
    image: "/islamabad-capital-city-with-mountains.webp",
    description: "Modern capital city"
  },
  "rawalpindi": {
    businesses: 1200,
    image: "/rawalpindi-bustling-commercial-area.webp",
    description: "Twin city commercial center"
  },
  "faisalabad": {
    businesses: 980,
    image: "/faisalabad-industrial-city-pakistan.webp",
    description: "Industrial textile hub"
  },
  "multan": {
    businesses: 750,
    image: "/multan-historical-city-pakistan.webp",
    description: "Historic trading center"
  },
}

export function TopCitiesSection() {
  const [topCities, setTopCities] = useState<TopCity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCities = async () => {
      try {
        const response = await fetch('/api/cities?country=Pakistan')
        const data = await response.json()
        
        if (data.ok && Array.isArray(data.cities)) {
          const mappedCities = data.cities
            .filter((city: City) => cityDescriptions[city.id.toLowerCase()])
            .slice(0, 6)
            .map((city: City) => ({
              ...city,
              slug: city.id.toLowerCase(),
              ...cityDescriptions[city.id.toLowerCase()]
            }))
          
          setTopCities(mappedCities)
        }
      } catch (error) {
        logger.error('Failed to fetch cities:', error)
        const fallbackCities = [
          { id: "karachi", name: "Karachi" },
          { id: "lahore", name: "Lahore" },
          { id: "islamabad", name: "Islamabad" },
          { id: "rawalpindi", name: "Rawalpindi" },
          { id: "faisalabad", name: "Faisalabad" },
          { id: "multan", name: "Multan" }
        ].map(city => ({
          ...city,
          slug: city.id,
          ...cityDescriptions[city.id]
        }))
        setTopCities(fallbackCities)
      } finally {
        setLoading(false)
      }
    }

    fetchCities()
  }, [])

  if (loading) {
    return (
      <section id="browse-cities" className="py-12 sm:py-16 md:py-20 bg-gradient-to-br from-gray-50 to-blue-50 scroll-mt-24">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-8 sm:mb-10 md:mb-12">
            <div className="inline-flex items-center space-x-2 bg-primary/10 text-primary px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-medium mb-4 sm:mb-5">
              <MapPin className="h-3 w-3 sm:h-4 sm:w-4" />
              <span>Loading Cities...</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl h-80 animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    )
  }
  return (
    <section id="browse-cities" className="py-12 sm:py-16 md:py-20 bg-gradient-to-br from-gray-50 to-blue-50 scroll-mt-24">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="text-center mb-8 sm:mb-10 md:mb-12">
          <div className="inline-flex items-center space-x-2 bg-primary/10 text-primary px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-medium mb-4 sm:mb-5">
            <MapPin className="h-3 w-3 sm:h-4 sm:w-4" />
            <span>Explore Cities</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-3 sm:mb-4">
            Discover Businesses in
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent"> Top Cities</span>
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-gray-600 max-w-3xl mx-auto px-4">
            From bustling metropolises to emerging commercial hubs, find trusted businesses across Pakistan's major cities.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 md:gap-6">
          {topCities.map((city, index) => (
            <Link key={city.slug} href={`/search?city=${city.slug}`}>
              <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer border-0 bg-white">
                <div className="flex h-32">
                  {/* Image Section */}
                  <div className="relative w-48 overflow-hidden">
                    <img
                      src={city.image || "/placeholder.svg"}
                      alt={city.name}
                      className="w-full h-full object-cover group-hover:opacity-90 transition-opacity duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent" />
                    
                    {/* Featured Badge */}
                    {index === 0 && (
                      <div className="absolute top-3 left-3">
                        <span className="bg-primary text-white px-2 py-1 rounded-full text-xs font-semibold">
                          Popular
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {/* Content Section */}
                  <div className="flex-1 p-4 sm:p-5 md:p-6 flex flex-col justify-center">
                    <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                      <h3 className="text-lg sm:text-xl font-bold text-gray-900">{city.name}</h3>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="w-7 h-7 sm:w-8 sm:h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                        </div>
                      </div>
                    </div>
                    <p className="text-gray-600 text-xs sm:text-sm mb-2 sm:mb-3">{city.description}</p>
                    <div className="flex items-center space-x-2 text-gray-500">
                      <Building2 className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="text-xs sm:text-sm font-medium">{city.businesses.toLocaleString()} businesses</span>
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>

        {/* View All Cities CTA */}
        <div className="text-center mt-8 sm:mt-10">
          <Link 
            href="/search" 
            className="inline-flex items-center space-x-2 bg-white hover:bg-gray-50 text-gray-900 px-6 sm:px-8 py-3 sm:py-4 rounded-lg sm:rounded-xl border border-gray-200 hover:border-primary/20 transition-all duration-200 shadow-md hover:shadow-lg text-sm sm:text-base"
          >
            <span className="font-semibold">View All Cities</span>
            <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
          </Link>
        </div>
      </div>
    </section>
  )
}