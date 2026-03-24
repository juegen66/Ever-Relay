"use client"

import { ArrowRight, Sparkles } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

export function HeroSection() {
  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 pt-16">
      {/* Subtle warm radial glow */}
      <div
        className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 h-[600px] w-[800px] animate-glow-pulse"
        style={{
          background: "radial-gradient(ellipse at center, rgba(52,199,89,0.06) 0%, transparent 70%)",
        }}
      />

      {/* Badge */}
      <div className="animate-hero mb-6 flex items-center gap-2 rounded-full border border-[#e8e4de] bg-white px-4 py-1.5 shadow-sm">
        <Sparkles className="h-3.5 w-3.5 text-[#34c759]" />
        <span className="text-[13px] text-[#6e6a62]">The Workspace for Creators</span>
      </div>

      {/* Headline */}
      <h1 className="animate-hero-delay-1 max-w-3xl text-center text-5xl font-bold leading-[1.1] tracking-tight text-[#1a1a2e] md:text-7xl text-balance">
        Begin with a logo — end with a{" "}
        <span
          className="bg-clip-text text-transparent animate-shimmer"
          style={{
            backgroundImage: "linear-gradient(110deg, #34c759, #30b350, #28a745, #34c759)",
            backgroundSize: "200% auto",
          }}
        >
          brand
        </span>
      </h1>

      {/* Subtitle */}
      <p className="animate-hero-delay-2 mt-6 max-w-xl text-center text-[17px] leading-relaxed text-[#8a8680]">
        A powerful, browser-based operating system designed for building, managing, and scaling your creative vision. No installation required.
      </p>

      {/* CTAs */}
      <div className="animate-hero-delay-3 mt-8 flex items-center gap-4">
        <Link
          href="/register"
          className="group flex items-center gap-2 rounded-full bg-[#34c759] px-7 py-3 text-[15px] font-semibold text-white transition-all hover:bg-[#2fb84e] hover:shadow-lg hover:shadow-[#34c759]/20"
        >
          Start Building
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
        <Link
          href="/desktop"
          className="rounded-full border border-[#ddd8d0] bg-white px-7 py-3 text-[15px] font-semibold text-[#1a1a2e] transition-all hover:bg-[#f5f2ee] hover:border-[#ccc7bf]"
        >
          Launch Workspace
        </Link>
      </div>

      {/* Hero Image - desktop screenshot */}
      <div className="animate-hero-delay-3 mt-16 w-full max-w-5xl animate-float">
        <div
          className="relative overflow-hidden rounded-2xl border border-[#e8e4de]"
          style={{
            boxShadow: "0 40px 80px -20px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.03)",
          }}
        >
          <Image
            src="/images/wallpaper.jpg"
            alt="EverRelay Desktop Preview"
            width={1920}
            height={1080}
            className="w-full"
            priority
          />
          {/* Overlay UI mockup on the screenshot */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
          {/* Fake menu bar */}
          <div className="absolute top-0 left-0 right-0 h-6 bg-black/20 backdrop-blur-xl flex items-center px-4">
            <div className="flex items-center gap-3">
              <svg className="h-3 w-3 text-white fill-white" viewBox="0 0 24 24"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83"/><path d="M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11"/></svg>
              <span className="text-[10px] text-white/80 font-medium">Finder</span>
              <span className="text-[10px] text-white/60">File</span>
              <span className="text-[10px] text-white/60">Edit</span>
              <span className="text-[10px] text-white/60">View</span>
            </div>
          </div>
        </div>
      </div>

      {/* Fade to next section */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#faf8f5] to-transparent" />
    </section>
  )
}
