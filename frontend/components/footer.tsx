import Link from "next/link"
import Image from "next/image"
import {
  Mail,
  MapPin,
  Phone,
  ArrowRight,
  Home,
  Search,
  PlusCircle,
  Info,
  Contact,
  UtensilsCrossed,
  HeartPulse,
  GraduationCap,
  Car,
  Building2,
  Laptop,
  Shield,
  FileText,
  Map,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { SITE_NAME } from "@/lib/site"

const linkBase =
  "inline-flex items-center gap-3 py-2.5 px-3 rounded-lg text-gray-300 hover:text-emerald-400 hover:bg-white/5 transition-all duration-200 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"

const iconWrap = "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-emerald-400 group-hover:bg-emerald-500/20 group-hover:text-emerald-300 transition-colors"

export function Footer() {
  return (
    <footer className="bg-slate-950 text-white">
      {/* Top accent */}
      <div className="h-1 bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-400" />

      <div className="container mx-auto px-4 sm:px-6 py-12 sm:py-14 lg:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12">
          {/* Brand Column */}
          <div className="sm:col-span-2 lg:col-span-2">
            <div className="flex items-center gap-3 mb-5">
              <div className="relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 shadow-lg ring-2 ring-white/10">
                <Image src="/bizbranches.pk.png" alt={SITE_NAME} fill className="object-contain" sizes="48px" />
              </div>
              <span className="text-xl sm:text-2xl font-bold text-white tracking-tight">BizBranches.Pk</span>
            </div>
            <p className="text-sm sm:text-base text-slate-400 leading-relaxed mb-8 max-w-md">
              Pakistan&apos;s free business listing directory. Find local businesses by city and category, add your business free,
              read reviews, and get contact details. Trusted across Pakistan.
            </p>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 mb-8">
              <div className="text-center py-4 px-3 rounded-xl bg-slate-800/60 border border-slate-700/60 shadow-inner">
                <div className="text-xl sm:text-2xl font-bold text-emerald-400">50K+</div>
                <div className="text-xs text-slate-500 mt-1 font-medium">Businesses</div>
              </div>
              <div className="text-center py-4 px-3 rounded-xl bg-slate-800/60 border border-slate-700/60 shadow-inner">
                <div className="text-xl sm:text-2xl font-bold text-blue-400">2M+</div>
                <div className="text-xs text-slate-500 mt-1 font-medium">Users</div>
              </div>
              <div className="text-center py-4 px-3 rounded-xl bg-slate-800/60 border border-slate-700/60 shadow-inner">
                <div className="text-xl sm:text-2xl font-bold text-violet-400">1M+</div>
                <div className="text-xs text-slate-500 mt-1 font-medium">Reviews</div>
              </div>
            </div>

            {/* Contact */}
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3 text-slate-400">
                <span className={iconWrap.replace("group-hover:", "hover:")}>
                  <MapPin className="h-4 w-4" />
                </span>
                <span>Pakistan — Find businesses in your city</span>
              </div>
              <a
                href="https://wa.me/923142552851"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-slate-400 hover:text-emerald-400 transition-colors"
              >
                <span className={iconWrap.replace("group-hover:", "hover:")}>
                  <Phone className="h-4 w-4" />
                </span>
                0314-2552851 (WhatsApp)
              </a>
              <a
                href="mailto:support@bizbranches.pk"
                className="flex items-center gap-3 text-slate-400 hover:text-emerald-400 transition-colors break-all"
              >
                <span className={iconWrap.replace("group-hover:", "hover:")}>
                  <Mail className="h-4 w-4" />
                </span>
                support@bizbranches.pk
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider text-slate-200 flex items-center gap-2 pb-2 border-b border-slate-700/80 w-fit">
              Quick Links
            </h4>
            <ul className="space-y-1 text-sm">
              <li>
                <Link href="/" className={linkBase}>
                  <span className={iconWrap}><Home className="h-4 w-4" /></span>
                  <span className="group-hover:translate-x-0.5 transition-transform">Home</span>
                </Link>
              </li>
              <li>
                <Link href="/search" className={linkBase}>
                  <span className={iconWrap}><Search className="h-4 w-4" /></span>
                  <span className="group-hover:translate-x-0.5 transition-transform">Browse Businesses</span>
                </Link>
              </li>
              <li>
                <Link href="/add" className={linkBase}>
                  <span className={iconWrap}><PlusCircle className="h-4 w-4" /></span>
                  <span className="group-hover:translate-x-0.5 transition-transform">List Your Business</span>
                </Link>
              </li>
              <li>
                <Link href="/about" className={linkBase}>
                  <span className={iconWrap}><Info className="h-4 w-4" /></span>
                  <span className="group-hover:translate-x-0.5 transition-transform">About Us</span>
                </Link>
              </li>
              <li>
                <Link href="/contact" className={linkBase}>
                  <span className={iconWrap}><Contact className="h-4 w-4" /></span>
                  <span className="group-hover:translate-x-0.5 transition-transform">Contact</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Popular Categories */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider text-slate-200 flex items-center gap-2 pb-2 border-b border-slate-700/80 w-fit">
              Popular Categories
            </h4>
            <ul className="space-y-1 text-sm">
              <li>
                <Link href="/category/restaurants" className={linkBase}>
                  <span className={iconWrap}><UtensilsCrossed className="h-4 w-4" /></span>
                  <span className="group-hover:translate-x-0.5 transition-transform">Restaurants</span>
                </Link>
              </li>
              <li>
                <Link href="/category/healthcare" className={linkBase}>
                  <span className={iconWrap}><HeartPulse className="h-4 w-4" /></span>
                  <span className="group-hover:translate-x-0.5 transition-transform">Healthcare</span>
                </Link>
              </li>
              <li>
                <Link href="/category/education" className={linkBase}>
                  <span className={iconWrap}><GraduationCap className="h-4 w-4" /></span>
                  <span className="group-hover:translate-x-0.5 transition-transform">Education</span>
                </Link>
              </li>
              <li>
                <Link href="/category/automotive" className={linkBase}>
                  <span className={iconWrap}><Car className="h-4 w-4" /></span>
                  <span className="group-hover:translate-x-0.5 transition-transform">Automotive</span>
                </Link>
              </li>
              <li>
                <Link href="/category/real-estate" className={linkBase}>
                  <span className={iconWrap}><Building2 className="h-4 w-4" /></span>
                  <span className="group-hover:translate-x-0.5 transition-transform">Real Estate</span>
                </Link>
              </li>
              <li>
                <Link href="/category/technology" className={linkBase}>
                  <span className={iconWrap}><Laptop className="h-4 w-4" /></span>
                  <span className="group-hover:translate-x-0.5 transition-transform">Technology</span>
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* CTA Strip */}
        <div className="mt-12 pt-10 border-t border-slate-800">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 rounded-2xl bg-gradient-to-r from-slate-800/80 to-slate-800/50 px-6 py-6 sm:px-8 sm:py-7 border border-slate-700/60 shadow-xl shadow-black/20">
            <div className="text-center sm:text-left">
              <h4 className="text-lg font-semibold text-white mb-1">Ready to grow your business?</h4>
              <p className="text-sm text-slate-400">List your business for free and reach millions of customers.</p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button asChild className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-6 shadow-lg shadow-emerald-900/30 focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900">
                <Link href="/add" className="flex items-center gap-2">
                  List Your Business
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <a
                href="https://wa.me/923142552851"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-600 text-slate-300 hover:border-emerald-500/50 hover:text-emerald-400 transition-colors text-sm font-medium bg-slate-800/40"
              >
                <Phone className="h-4 w-4" />
                WhatsApp: 0314-2552851
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-slate-800 bg-slate-900/50">
        <div className="container mx-auto px-4 sm:px-6 py-5">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-slate-500 text-xs sm:text-sm text-center sm:text-left space-y-1" suppressHydrationWarning>
              <p>© {new Date().getFullYear()} {SITE_NAME}. All rights reserved.</p>
              <p>
                A project of{" "}
                <a
                  href="https://digitalskillshouse.pk"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-400 hover:text-emerald-300 underline transition-colors"
                >
                  Digital Skills House
                </a>.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 text-xs sm:text-sm">
              <Link href="/privacy" className="inline-flex items-center gap-2 text-slate-500 hover:text-emerald-400 transition-colors">
                <Shield className="h-4 w-4" />
                Privacy Policy
              </Link>
              <Link href="/terms" className="inline-flex items-center gap-2 text-slate-500 hover:text-emerald-400 transition-colors">
                <FileText className="h-4 w-4" />
                Terms of Service
              </Link>
              <a href="/sitemap.xml" className="inline-flex items-center gap-2 text-slate-500 hover:text-emerald-400 transition-colors">
                <Map className="h-4 w-4" />
                Sitemap
              </a>
              <Link href="/llms.txt" className="inline-flex items-center gap-2 text-slate-500 hover:text-emerald-400 transition-colors" rel="alternate" type="text/plain">
                <Info className="h-4 w-4" />
                For AI / LLMs
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
