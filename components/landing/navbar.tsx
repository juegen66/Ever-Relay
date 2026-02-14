"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Monitor, Menu, X } from "lucide-react"

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
          ? "bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/[0.06]"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#007aff] to-[#5856d6]">
            <Monitor className="h-4 w-4 text-white" />
          </div>
          <span className="text-[17px] font-semibold tracking-tight text-white">
            CloudOS
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden items-center gap-8 md:flex">
          <a href="#features" className="text-[14px] text-white/60 transition-colors hover:text-white">
            Features
          </a>
          <a href="#apps" className="text-[14px] text-white/60 transition-colors hover:text-white">
            Apps
          </a>
          <a href="#register" className="text-[14px] text-white/60 transition-colors hover:text-white">
            Register
          </a>
        </div>

        {/* CTA */}
        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/desktop"
            className="text-[14px] text-white/70 transition-colors hover:text-white"
          >
            Sign In
          </Link>
          <a
            href="#register"
            className="rounded-full bg-white px-5 py-2 text-[14px] font-medium text-[#0a0a0f] transition-all hover:bg-white/90 hover:shadow-lg hover:shadow-white/10"
          >
            Get Started
          </a>
        </div>

        {/* Mobile Toggle */}
        <button
          className="text-white md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="border-t border-white/[0.06] bg-[#0a0a0f]/95 backdrop-blur-xl px-6 py-4 md:hidden">
          <div className="flex flex-col gap-3">
            <a href="#features" onClick={() => setMobileOpen(false)} className="text-[14px] text-white/60 hover:text-white py-2">Features</a>
            <a href="#apps" onClick={() => setMobileOpen(false)} className="text-[14px] text-white/60 hover:text-white py-2">Apps</a>
            <a href="#register" onClick={() => setMobileOpen(false)} className="text-[14px] text-white/60 hover:text-white py-2">Register</a>
            <div className="pt-2 border-t border-white/[0.06] flex flex-col gap-2">
              <Link href="/desktop" className="text-[14px] text-white/70 hover:text-white py-2">Sign In</Link>
              <a href="#register" onClick={() => setMobileOpen(false)} className="rounded-full bg-white px-5 py-2.5 text-center text-[14px] font-medium text-[#0a0a0f]">Get Started</a>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
