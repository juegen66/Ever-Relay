import { Monitor } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t border-white/[0.06] px-6 py-12">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 md:flex-row md:justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-[#007aff] to-[#5856d6]">
            <Monitor className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="text-[14px] font-semibold text-white/70">CloudOS</span>
        </div>

        <div className="flex items-center gap-6 text-[13px] text-white/30">
          <a href="#features" className="hover:text-white/60 transition-colors">Features</a>
          <a href="#apps" className="hover:text-white/60 transition-colors">Apps</a>
          <a href="#register" className="hover:text-white/60 transition-colors">Register</a>
        </div>

        <p className="text-[12px] text-white/20">
          Built with Next.js. Not affiliated with Apple Inc.
        </p>
      </div>
    </footer>
  )
}
