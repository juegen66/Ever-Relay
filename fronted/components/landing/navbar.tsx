"use client"

import { useState, useEffect } from "react"

import { Monitor, Menu, X } from "lucide-react"
import Link from "next/link"

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[#faf8f5]/80 backdrop-blur-xl border-b border-[#e8e4de]"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#34c759]">
            <Monitor className="h-4 w-4 text-white" />
          </div>
          <span className="text-[17px] font-bold tracking-tight text-[#1a1a2e]">
            Cloud<span className="text-[#34c759]">OS</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden items-center gap-8 md:flex">
          <a href="#features" className="text-[14px] text-[#8a8680] transition-colors hover:text-[#1a1a2e]">
            Features
          </a>
          <a href="#apps" className="text-[14px] text-[#8a8680] transition-colors hover:text-[#1a1a2e]">
            Apps
          </a>
        </div>

        {/* CTA */}
        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/login"
            className="text-[14px] font-medium text-[#8a8680] transition-colors hover:text-[#1a1a2e]"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="rounded-full bg-[#34c759] px-5 py-2 text-[14px] font-semibold text-white transition-all hover:bg-[#2fb84e] hover:shadow-md hover:shadow-[#34c759]/15"
          >
            Get Started
          </Link>
        </div>

        {/* Mobile Toggle */}
        <button
          className="text-[#1a1a2e] md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="border-t border-[#e8e4de] bg-[#faf8f5]/95 backdrop-blur-xl px-6 py-4 md:hidden">
          <div className="flex flex-col gap-3">
            <a href="#features" onClick={() => setMobileOpen(false)} className="text-[14px] text-[#8a8680] hover:text-[#1a1a2e] py-2">Features</a>
            <a href="#apps" onClick={() => setMobileOpen(false)} className="text-[14px] text-[#8a8680] hover:text-[#1a1a2e] py-2">Apps</a>
            <div className="pt-2 border-t border-[#e8e4de] flex flex-col gap-2">
            <Link href="/login" className="text-[14px] text-[#8a8680] hover:text-[#1a1a2e] py-2">Sign In</Link>
            <Link href="/register" onClick={() => setMobileOpen(false)} className="rounded-full bg-[#34c759] px-5 py-2.5 text-center text-[14px] font-semibold text-white">Get Started</Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
