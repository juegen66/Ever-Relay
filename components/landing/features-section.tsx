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
    title: "窗口管理",
    description: "拖拽、调整大小、最小化、最大化 -- 像真实桌面一样的完整窗口管理。",
    color: "#007aff",
  },
  {
    icon: Zap,
    title: "即时访问",
    description: "无需下载或安装，打开浏览器即可立即开始使用。",
    color: "#ff9f0a",
  },
  {
    icon: Shield,
    title: "安全登录",
    description: "基于账户的身份认证，密码安全保护你的工作空间。",
    color: "#34c759",
  },
  {
    icon: Palette,
    title: "精美设计",
    description: "像素级还原的 macOS 风格界面，毛玻璃效果与流畅动画。",
    color: "#af52de",
  },
]

const APPS = [
  { icon: FolderOpen, name: "访达", desc: "文件管理", color: "#007aff" },
  { icon: Globe, name: "Safari", desc: "浏览器", color: "#007aff" },
  { icon: Terminal, name: "终端", desc: "命令行", color: "#3a3a3c" },
  { icon: Music, name: "音乐", desc: "音频播放", color: "#fc3c44" },
  { icon: Mail, name: "邮件", desc: "邮件客户端", color: "#007aff" },
  { icon: Calculator, name: "计算器", desc: "数学工具", color: "#636366" },
  { icon: Camera, name: "照片", desc: "相册", color: "#ff375f" },
  { icon: MessageSquare, name: "信息", desc: "聊天", color: "#34c759" },
  { icon: CalendarDays, name: "日历", desc: "日程规划", color: "#ff3b30" },
  { icon: Cloud, name: "天气", desc: "天气预报", color: "#64d2ff" },
  { icon: MapPin, name: "地图", desc: "导航", color: "#34c759" },
  { icon: Monitor, name: "设置", desc: "系统偏好", color: "#8e8e93" },
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
              你所需要的，{" "}
              <span className="text-[#b0aca4]">全部内置。</span>
            </h2>
            <p
              className={`mt-4 text-[17px] text-[#8a8680] ${features.visible ? "reveal-on-scroll" : "opacity-0"}`}
              style={{ animationDelay: "0.1s" }}
            >
              为现代网络而设计的桌面体验。
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
              15+ 款内置应用
            </h2>
            <p
              className={`mt-4 text-[17px] text-[#8a8680] ${apps.visible ? "reveal-on-scroll" : "opacity-0"}`}
              style={{ animationDelay: "0.1s" }}
            >
              办公、娱乐、沟通，你需要的每款应用都已就绪。
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
            准备好开始了吗？
          </h2>
          <p
            className={`mt-4 text-[17px] text-[#8a8680] ${cta.visible ? "reveal-on-scroll" : "opacity-0"}`}
            style={{ animationDelay: "0.1s" }}
          >
            创建免费账户，几秒钟即可访问你的云端桌面。
          </p>
          <div
            className={`mt-8 flex items-center justify-center gap-4 ${cta.visible ? "reveal-on-scroll" : "opacity-0"}`}
            style={{ animationDelay: "0.2s" }}
          >
            <Link
              href="/register"
              className="group flex items-center gap-2 rounded-full bg-[#34c759] px-8 py-3.5 text-[15px] font-semibold text-white transition-all hover:bg-[#2fb84e] hover:shadow-lg hover:shadow-[#34c759]/20"
            >
              免费注册账户
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
