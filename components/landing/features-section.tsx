"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import {
  Monitor,
  Terminal,
  FolderOpen,
  Music,
  Globe,
  Mail,
  Calculator,
  Camera,
  MessageSquare,
  CalendarDays,
  Cloud,
  MapPin,
  Shield,
  Zap,
  Layers,
  Palette,
} from "lucide-react"

const FEATURES = [
  {
    icon: Layers,
    title: "Multitasking Canvas",
    description: "Drag, resize, and organize your tools. Keep your inspiration and work side-by-side.",
    color: "#007aff",
  },
  {
    icon: Zap,
    title: "Zero Friction",
    description: "No downloads. Open your browser and start creating immediately.",
    color: "#ff9f0a",
  },
  {
    icon: Shield,
    title: "Asset Protection",
    description: "Account-based authentication keeps your brand assets and projects secure.",
    color: "#34c759",
  },
  {
    icon: Palette,
    title: "Canvas-Ready UI",
    description: "A pixel-perfect interface that stays out of your way and lets your work shine.",
    color: "#af52de",
  },
]

const APPS = [
  { icon: FolderOpen, name: "Finder", desc: "Asset Manager", color: "#007aff" },
  { icon: Globe, name: "Safari", desc: "Research Browser", color: "#007aff" },
  { icon: Terminal, name: "Terminal", desc: "Dev Tools", color: "#3a3a3c" },
  { icon: Music, name: "Music", desc: "Audio player", color: "#fc3c44" },
  { icon: Mail, name: "Mail", desc: "Email client", color: "#007aff" },
  { icon: Calculator, name: "Calculator", desc: "Math tools", color: "#636366" },
  { icon: Camera, name: "Photos", desc: "Media Library", color: "#ff375f" },
  { icon: MessageSquare, name: "Messages", desc: "Team Chat", color: "#34c759" },
  { icon: CalendarDays, name: "Calendar", desc: "Content Calendar", color: "#ff3b30" },
  { icon: Cloud, name: "Weather", desc: "Forecasts", color: "#64d2ff" },
  { icon: MapPin, name: "Maps", desc: "Navigation", color: "#34c759" },
  { icon: Monitor, name: "Settings", desc: "Preferences", color: "#8e8e93" },
]

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true) },
      { threshold }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [threshold])
  return { ref, visible }
}

export function FeaturesSection() {
  const features = useInView()
  const apps = useInView()
  const cta = useInView()

  return (
    <>
      {/* Features */}
      <section id="features" className="relative px-6 py-24" ref={features.ref}>
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <h2
              className={`text-3xl font-bold tracking-tight text-[#1a1a2e] md:text-5xl text-balance ${features.visible ? "reveal-on-scroll" : "opacity-0"}`}
            >
              Tools for your creative flow.
            </h2>
            <p
              className={`mt-4 text-[17px] text-[#8a8680] ${features.visible ? "reveal-on-scroll" : "opacity-0"}`}
              style={{ animationDelay: "0.1s" }}
            >
              An operating system optimized for your creative process.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f, i) => (
              <div
                key={f.title}
                className={`group rounded-2xl border border-[#e8e4de] bg-white p-6 transition-all hover:border-[#d8d4ce] hover:shadow-md ${features.visible ? "reveal-on-scroll" : "opacity-0"}`}
                style={{ animationDelay: `${0.1 + i * 0.08}s` }}
              >
                <div
                  className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{ background: `${f.color}14` }}
                >
                  <f.icon className="h-5 w-5" style={{ color: f.color }} />
                </div>
                <h3 className="mb-2 text-[15px] font-semibold text-[#1a1a2e]">
                  {f.title}
                </h3>
                <p className="text-[13px] leading-relaxed text-[#8a8680]">
                  {f.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Apps Grid */}
      <section id="apps" className="relative px-6 py-24" ref={apps.ref}>
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <h2
              className={`text-3xl font-bold tracking-tight text-[#1a1a2e] md:text-5xl ${apps.visible ? "reveal-on-scroll" : "opacity-0"}`}
            >
              A Suite for Creators
            </h2>
            <p
              className={`mt-4 text-[17px] text-[#8a8680] ${apps.visible ? "reveal-on-scroll" : "opacity-0"}`}
              style={{ animationDelay: "0.1s" }}
            >
              Essential tools for managing your brand and workflow.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4 md:grid-cols-4 lg:grid-cols-6">
            {APPS.map((app, i) => (
              <div
                key={app.name}
                className={`group flex flex-col items-center gap-3 rounded-2xl border border-[#e8e4de] bg-white p-5 transition-all hover:border-[#d8d4ce] hover:shadow-md ${apps.visible ? "reveal-on-scroll" : "opacity-0"}`}
                style={{ animationDelay: `${0.05 + i * 0.04}s` }}
              >
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-[13px] shadow-lg transition-transform group-hover:scale-110"
                  style={{ background: `linear-gradient(135deg, ${app.color}, ${app.color}cc)` }}
                >
                  <app.icon className="h-6 w-6 text-white" />
                </div>
                <div className="text-center">
                  <div className="text-[13px] font-medium text-[#1a1a2e]">{app.name}</div>
                  <div className="text-[11px] text-[#b0aca4]">{app.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative px-6 py-24" ref={cta.ref}>
        <div className="mx-auto max-w-2xl text-center">
          <h2
            className={`text-3xl font-bold tracking-tight text-[#1a1a2e] md:text-5xl text-balance ${cta.visible ? "reveal-on-scroll" : "opacity-0"}`}
          >
            Ready to build your brand?
          </h2>
          <p
            className={`mt-4 text-[17px] text-[#8a8680] ${cta.visible ? "reveal-on-scroll" : "opacity-0"}`}
            style={{ animationDelay: "0.1s" }}
          >
            Create a free account and access your cloud desktop in seconds.
          </p>
          <div
            className={`mt-8 flex items-center justify-center gap-4 ${cta.visible ? "reveal-on-scroll" : "opacity-0"}`}
            style={{ animationDelay: "0.2s" }}
          >
            <Link
              href="/register"
              className="group flex items-center gap-2 rounded-full bg-[#34c759] px-8 py-3.5 text-[15px] font-semibold text-white transition-all hover:bg-[#2fb84e] hover:shadow-lg hover:shadow-[#34c759]/20"
            >
              Start Building for Free
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
