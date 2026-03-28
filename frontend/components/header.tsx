"use client"

import Link from "next/link"
import Image from "next/image"
import { MessageCircle, Plus, Globe, ChevronDown } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SITE_NAME, SITE_WHATSAPP_URL } from "@/lib/site"

export function Header() {
  return (
    <header className="bg-slate-900 border-b border-slate-700/80 sticky top-0 z-50 shadow-md">
      <div className="container mx-auto px-4 sm:px-6 max-w-[100vw] overflow-x-hidden">
        <div className="flex items-center justify-between gap-2 h-14 sm:h-16 min-h-[3.5rem]">
          {/* Logo: left on mobile (logo only), center on desktop with text */}
          <Link href="/" className="flex md:flex-1 md:justify-center items-center gap-2 sm:gap-3 flex-shrink-0 min-w-0" aria-label="Home">
            <div className="relative w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl overflow-hidden flex-shrink-0 group-hover:shadow-xl transition-all duration-300 shadow-lg aspect-square">
              <Image src="/bizbranches.pk.png" alt={SITE_NAME} fill className="object-contain" sizes="56px" priority />
            </div>
            <span className="hidden md:inline text-lg sm:text-xl font-bold text-white group-hover:text-green-400 transition-colors duration-300">BizBranches.Pk</span>
          </Link>

          {/* Mobile: WhatsApp only (bottom bar handles navigation) */}
          <a
            href={SITE_WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="md:hidden flex-shrink-0 flex items-center justify-center w-11 h-11 min-w-[44px] min-h-[44px] rounded-lg text-white bg-emerald-500/20 border border-emerald-400/35 hover:bg-emerald-500/30 focus:outline-none focus:ring-2 focus:ring-emerald-400/60"
            aria-label="Contact us on WhatsApp"
          >
            <MessageCircle className="h-6 w-6" aria-hidden />
          </a>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center flex-1 justify-end gap-2 lg:gap-4">
            <nav className="flex items-center gap-5 lg:gap-8">
              <Link href="/" className="text-white/90 hover:text-white font-medium text-sm transition-colors">
                Home
              </Link>
              <Link href="/category" className="text-white/90 hover:text-white font-medium text-sm transition-colors">
                Categories
              </Link>
            </nav>

            {/* Directories dropdown - country names only */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1.5 text-white/80 hover:text-white text-sm font-medium transition-colors py-2 px-2.5 rounded-md hover:bg-white/10" aria-label="Other directories">
                  <Globe className="h-4 w-4" />
                  <span>Directories</span>
                  <ChevronDown className="h-3.5 w-3.5 opacity-70" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[120px] bg-white py-1 rounded-lg shadow-lg border border-gray-100">
                <DropdownMenuItem asChild>
                  <a href="https://bizbranches.pk" target="_blank" rel="noopener noreferrer" className="cursor-pointer text-sm py-2">
                    Pakistan
                  </a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a href="https://bizbranches.uk" target="_blank" rel="noopener noreferrer" className="cursor-pointer text-sm py-2">
                    UK
                  </a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a href="https://bizbranches.us" target="_blank" rel="noopener noreferrer" className="cursor-pointer text-sm py-2">
                    USA
                  </a>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Add Business - primary CTA */}
            <Link
              href="/add"
              className="inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white font-semibold text-sm px-4 py-2.5 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-slate-900"
              aria-label="Add your business free"
            >
              <Plus className="h-4 w-4 shrink-0" />
              <span>Add Business</span>
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}