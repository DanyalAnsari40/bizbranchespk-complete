"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Search, FileText, MessageCircle, Building2, ArrowRight, Sparkles, CheckCircle2, Star, Users, Globe, Zap } from "lucide-react"
import Link from "next/link"
import { useEffect, useRef } from "react"

const steps = [
  {
    step: "1",
    title: "Search & Discover",
    description: "Find businesses in Pakistan by name, category, or city. Use the search bar or browse categories and cities.",
    icon: Search,
    color: "from-blue-500 to-cyan-500",
    bgColor: "bg-blue-50",
    features: ["Search by Name", "Filter by City", "Browse Categories"]
  },
  {
    step: "2",
    title: "Browse & Compare",
    description: "View business profiles with contact details, address, description, and reviews. Compare options before contacting.",
    icon: FileText,
    color: "from-purple-500 to-pink-500",
    bgColor: "bg-purple-50",
    features: ["Contact Details", "Address & Map", "Reviews"]
  },
  {
    step: "3",
    title: "Connect & Engage",
    description: "Open WhatsApp, email, or website from each listing. We prioritize chat-friendly contact for a smoother experience.",
    icon: MessageCircle,
    color: "from-green-500 to-emerald-500",
    bgColor: "bg-green-50",
    features: ["WhatsApp", "Email", "Website"]
  },
  {
    step: "4",
    title: "List Your Business",
    description: "Business owner? Add your business free on BizBranches. Reach customers across Pakistan at no cost.",
    icon: Building2,
    color: "from-orange-500 to-red-500",
    bgColor: "bg-orange-50",
    features: ["Free Listing", "Pakistan-Wide", "Instant Visibility"]
  },
]

const stats = [
  { icon: Users, value: "Find", label: "Businesses" },
  { icon: Building2, value: "Add Free", label: "Your Listing" },
  { icon: Globe, value: "Pakistan", label: "Coverage" },
  { icon: Star, value: "Free", label: "No Fees" },
]

export function HowItWorksSection() {
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("animate-in")
          }
        })
      },
      { threshold: 0.1 }
    )

    if (sectionRef.current) {
      const cards = sectionRef.current.querySelectorAll(".step-card")
      cards.forEach((card) => observer.observe(card))

      return () => {
        cards.forEach((card) => observer.unobserve(card))
      }
    }
  }, [])

  return (
    <section ref={sectionRef} className="py-16 md:py-24 bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 relative overflow-hidden">
      {/* Enhanced background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-cyan-400/10 to-blue-400/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-12 max-w-7xl relative z-10">
        {/* Enhanced Header Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-primary/20 rounded-full px-6 py-3 mb-6 shadow-lg">
            <Zap className="h-5 w-5 text-primary animate-pulse" />
            <span className="text-sm font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">Simple & Powerful Process</span>
            <Sparkles className="h-5 w-5 text-purple-500 animate-bounce" />
          </div>
          
          <h2 className="text-4xl md:text-6xl font-black text-gray-900 mb-6 leading-tight">
            How It 
            <span className="relative inline-block">
              <span className="bg-gradient-to-r from-primary via-purple-600 to-pink-600 bg-clip-text text-transparent">Works</span>
              <div className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-primary via-purple-600 to-pink-600 rounded-full opacity-30"></div>
            </span>
          </h2>
          
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed mb-8">
            Find local businesses in Pakistan or add your business free. Search by category and city—no signup or fee required.
          </p>

          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto mb-12">
            {stats.map((stat, index) => {
              const Icon = stat.icon
              return (
                <div key={index} className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300">
                  <Icon className="h-8 w-8 text-primary mx-auto mb-2" />
                  <div className="text-2xl font-black text-gray-900">{stat.value}</div>
                  <div className="text-sm text-gray-600 font-medium">{stat.label}</div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Enhanced Steps Grid */}
        <div className="relative">
          {/* Animated connecting line */}
          <div className="hidden lg:block absolute top-32 left-0 right-0 h-1 bg-gradient-to-r from-blue-200 via-purple-200 via-green-200 to-orange-200 rounded-full opacity-40">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/40 to-transparent animate-pulse rounded-full"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
            {steps.map((step, index) => {
              const Icon = step.icon
              return (
                <div
                  key={step.step}
                  className="step-card opacity-0 translate-y-8 transition-all duration-700 ease-out"
                  style={{ transitionDelay: `${index * 200}ms` }}
                >
                  <Card className="h-full border-0 shadow-2xl hover:shadow-3xl transition-all duration-500 bg-white/80 backdrop-blur-sm group overflow-hidden relative hover:scale-105">
                    {/* Enhanced gradient overlay */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${step.color} opacity-0 group-hover:opacity-10 transition-all duration-500`}></div>
                    
                    <CardContent className="p-8 relative z-10">
                      {/* Enhanced Step Number Badge */}
                      <div className="flex items-center justify-center mb-6">
                        <div className="relative">
                          <div className={`w-24 h-24 rounded-3xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-2xl group-hover:shadow-3xl transition-all duration-500 group-hover:rotate-6`}>
                            <span className="text-3xl font-black text-white">{step.step}</span>
                          </div>
                          {/* Multiple animated rings */}
                          <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${step.color} opacity-20 animate-ping`}></div>
                          <div className={`absolute -inset-2 rounded-3xl bg-gradient-to-br ${step.color} opacity-10 animate-pulse delay-300`}></div>
                        </div>
                      </div>

                      {/* Enhanced Icon */}
                      <div className="flex justify-center mb-6">
                        <div className={`w-20 h-20 rounded-2xl ${step.bgColor} flex items-center justify-center group-hover:shadow-xl transition-all duration-500 relative overflow-hidden border-2 border-white/50`}>
                          <div className={`absolute inset-0 bg-gradient-to-br ${step.color} opacity-0 group-hover:opacity-20 transition-all duration-500`}></div>
                          <Icon className="h-10 w-10 text-gray-700 relative z-10 group-hover:scale-110 transition-transform duration-300" />
                        </div>
                      </div>

                      {/* Enhanced Content */}
                      <div className="text-center space-y-4">
                        <h3 className="text-xl font-black text-gray-900 group-hover:text-primary transition-colors duration-300">
                          {step.title}
                        </h3>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          {step.description}
                        </p>
                        
                        {/* Feature tags */}
                        <div className="flex flex-wrap justify-center gap-2 mt-4">
                          {step.features.map((feature, idx) => (
                            <span key={idx} className="px-3 py-1 bg-gray-100 text-xs font-semibold text-gray-700 rounded-full border border-gray-200">
                              {feature}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Enhanced Arrow connector */}
                      {index < steps.length - 1 && (
                        <div className="hidden lg:block absolute top-1/2 -right-6 -translate-y-1/2 z-20">
                          <div className="w-12 h-12 rounded-full bg-white border-4 border-gray-100 flex items-center justify-center shadow-xl">
                            <ArrowRight className="h-6 w-6 text-primary animate-pulse" />
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )
            })}
          </div>
        </div>

        {/* Enhanced CTA Section */}
        <div className="text-center mt-20">
          <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-8 md:p-12 border border-white/20 shadow-2xl max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-primary/10 to-purple-500/10 border border-primary/20 rounded-full px-6 py-2 mb-6">
              <Star className="h-5 w-5 text-yellow-500" />
              <span className="text-sm font-bold text-primary">Ready to Get Started?</span>
              <Star className="h-5 w-5 text-yellow-500" />
            </div>
            
            <h3 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">
              Join the <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">Revolution</span>
            </h3>
            
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              Search for businesses in Pakistan or add your business free. No credit card, no fees.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/add">
                <Button size="lg" className="px-8 py-6 text-lg font-bold shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
                  <Building2 className="h-6 w-6 mr-3" />
                  <span>List Your Business FREE</span>
                  <ArrowRight className="h-6 w-6 ml-3" />
                </Button>
              </Link>
              
              <Link href="/search">
                <Button variant="outline" size="lg" className="px-8 py-6 text-lg font-bold border-2 hover:bg-primary hover:text-white transition-all duration-300">
                  <Search className="h-6 w-6 mr-3" />
                  <span>Explore Businesses</span>
                </Button>
              </Link>
            </div>
            
            <div className="flex items-center justify-center gap-6 mt-8 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span>100% Free</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span>Instant Approval</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span>Global Reach</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .step-card.animate-in {
          opacity: 1;
          transform: translateY(0);
        }
      `}</style>
    </section>
  )
}
