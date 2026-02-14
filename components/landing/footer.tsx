import Link from "next/link"
import { Monitor } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t border-[#e8e4de] px-6 py-12">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 md:flex-row md:justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#34c759]">
            <Monitor className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="text-[14px] font-bold text-[#1a1a2e]">
            Cloud<span className="text-[#34c759]">OS</span>
          </span>
        </Link>

        <div className="flex items-center gap-6 text-[13px] text-[#b0aca4]">
          <a href="#features" className="hover:text-[#8a8680] transition-colors">Features</a>
          <a href="#apps" className="hover:text-[#8a8680] transition-colors">Apps</a>
          <Link href="/register" className="hover:text-[#8a8680] transition-colors">注册</Link>
        </div>

        <p className="text-[12px] text-[#c5c0b8]">
          Built with Next.js. Not affiliated with Apple Inc.
        </p>
      </div>
    </footer>
  )
}
