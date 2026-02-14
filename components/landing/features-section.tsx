"use client"

import { useEffect, useRef, useState } from "react"
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
    title: "Window Management",
    description: "Drag, resize, minimize, maximize -- full window management just like a real desktop.",
    color: "#007aff",
  },
  {
    icon: Zap,
    title: "Instant Access",
    description: "No downloads or installations. Open your browser and start working immediately.",
    color: "#ff9f0a",
  },
  {
    icon: Shield,
    title: "Secure Login",
    description: "Account-based authentication protects your workspace with password security.",
    color: "#30d158",
  },
  {
    icon: Palette,
    title: "Stunning Design",
    description: "Pixel-perfect macOS-inspired interface with frosted glass effects and smooth animations.",
    color: "#af52de",
  },
]

const APPS = [
  { icon: FolderOpen, name: "Finder", desc: "File management", color: "#007aff" },
  { icon: Globe, name: "Safari", desc: "Web browser", color: "#007aff" },
  { icon: Terminal, name: "Terminal", desc: "Command line", color: "#1a1a1a" },
  { icon: Music, name: "Music", desc: "Audio player", color: "#fc3c44" },
  { icon: Mail, name: "Mail", desc: "Email client", color: "#007aff" },
  { icon: Calculator, name: "Calculator", desc: "Math tools", color: "#333" },
  { icon: Camera, name: "Photos", desc: "Photo gallery", color: "#ff375f" },
  { icon: MessageSquare, name: "Messages", desc: "Chat app", color: "#30d158" },
  { icon: CalendarDays, name: "Calendar", desc: "Schedule planner", color: "#ff3b30" },
  { icon: Cloud, name: "Weather", desc: "Forecasts", color: "#64d2ff" },
  { icon: MapPin, name: "Maps", desc: "Navigation", color: "#30d158" },
  { icon: Monitor, name: "Settings", desc: "System preferences", color: "#8e8e93" },
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

  return (
    <>
      {/* Features */}
      <section id="features" className="relative px-6 py-24" ref={features.ref}>
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <h2
              className={`text-3xl font-bold tracking-tight text-white md:text-5xl ${features.visible ? "reveal-on-scroll" : "opacity-0"}`}
            >
              Everything you need,{" "}
              <span className="text-white/40">built in.</span>
            </h2>
            <p
              className={`mt-4 text-[17px] text-white/40 ${features.visible ? "reveal-on-scroll" : "opacity-0"}`}
              style={{ animationDelay: "0.1s" }}
            >
              A desktop experience designed for the modern web.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f, i) => (
              <div
                key={f.title}
                className={`group rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 transition-all hover:border-white/[0.12] hover:bg-white/[0.04] ${features.visible ? "reveal-on-scroll" : "opacity-0"}`}
                style={{ animationDelay: `${0.1 + i * 0.08}s` }}
              >
                <div
                  className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{ background: `${f.color}18` }}
                >
                  <f.icon className="h-5 w-5" style={{ color: f.color }} />
                </div>
                <h3 className="mb-2 text-[15px] font-semibold text-white">
                  {f.title}
                </h3>
                <p className="text-[13px] leading-relaxed text-white/40">
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
              className={`text-3xl font-bold tracking-tight text-white md:text-5xl ${apps.visible ? "reveal-on-scroll" : "opacity-0"}`}
            >
              15+ Built-in Apps
            </h2>
            <p
              className={`mt-4 text-[17px] text-white/40 ${apps.visible ? "reveal-on-scroll" : "opacity-0"}`}
              style={{ animationDelay: "0.1s" }}
            >
              Every app you need for productivity, entertainment, and communication.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4 md:grid-cols-4 lg:grid-cols-6">
            {APPS.map((app, i) => (
              <div
                key={app.name}
                className={`group flex flex-col items-center gap-3 rounded-2xl border border-white/[0.04] bg-white/[0.02] p-5 transition-all hover:border-white/[0.1] hover:bg-white/[0.05] ${apps.visible ? "reveal-on-scroll" : "opacity-0"}`}
                style={{ animationDelay: `${0.05 + i * 0.04}s` }}
              >
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-[13px] shadow-lg transition-transform group-hover:scale-110"
                  style={{ background: `linear-gradient(135deg, ${app.color}, ${app.color}cc)` }}
                >
                  <app.icon className="h-6 w-6 text-white" />
                </div>
                <div className="text-center">
                  <div className="text-[13px] font-medium text-white">{app.name}</div>
                  <div className="text-[11px] text-white/30">{app.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
