"use client"

import { X } from "lucide-react"

interface AboutMacProps {
  onClose: () => void
}

export function AboutMac({ onClose }: AboutMacProps) {
  return (
    <div
      className="fixed inset-0 z-[10005] flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.3)" }}
      onClick={onClose}
    >
      <div
        className="relative w-[540px] overflow-hidden rounded-2xl"
        style={{
          background: "rgba(246, 246, 246, 0.96)",
          backdropFilter: "blur(50px) saturate(180%)",
          WebkitBackdropFilter: "blur(50px) saturate(180%)",
          boxShadow: "0 24px 80px rgba(0,0,0,0.28), 0 0 0 0.5px rgba(0,0,0,0.1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 left-3 z-10 flex h-[12px] w-[12px] items-center justify-center rounded-full transition-all group"
          style={{ background: "#ff5f57" }}
          aria-label="Close"
        >
          <X className="h-2 w-2 text-[#800] opacity-0 group-hover:opacity-100" />
        </button>

        <div className="flex flex-col items-center px-10 py-8">
          {/* macOS logo area */}
          <div
            className="mb-4 flex h-28 w-28 items-center justify-center rounded-[28px] animate-gradient"
            style={{
              background: "linear-gradient(135deg, #ff6b6b, #ffa07a, #ffd700, #87ceeb, #9370db, #ff69b4)",
              backgroundSize: "200% 200%",
            }}
          >
            <svg className="h-14 w-14 text-white drop-shadow-lg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
            </svg>
          </div>

          <h1 className="text-[28px] font-bold text-[#333]">macOS Sequoia</h1>
          <p className="mt-1 text-[13px] text-[#999]">Version 15.2</p>

          <div className="mt-6 w-full space-y-2 text-center text-[13px]">
            <div className="flex justify-between px-4 py-2 rounded-lg bg-white" style={{ border: "1px solid rgba(0,0,0,0.05)" }}>
              <span className="text-[#666]">Chip</span>
              <span className="font-medium text-[#333]">Apple M3 Pro</span>
            </div>
            <div className="flex justify-between px-4 py-2 rounded-lg bg-white" style={{ border: "1px solid rgba(0,0,0,0.05)" }}>
              <span className="text-[#666]">Memory</span>
              <span className="font-medium text-[#333]">18 GB</span>
            </div>
            <div className="flex justify-between px-4 py-2 rounded-lg bg-white" style={{ border: "1px solid rgba(0,0,0,0.05)" }}>
              <span className="text-[#666]">Startup Disk</span>
              <span className="font-medium text-[#333]">Macintosh HD</span>
            </div>
            <div className="flex justify-between px-4 py-2 rounded-lg bg-white" style={{ border: "1px solid rgba(0,0,0,0.05)" }}>
              <span className="text-[#666]">Serial Number</span>
              <span className="font-medium text-[#333]">C02X8KHDXX78</span>
            </div>
            <div className="flex justify-between px-4 py-2 rounded-lg bg-white" style={{ border: "1px solid rgba(0,0,0,0.05)" }}>
              <span className="text-[#666]">Display</span>
              <span className="font-medium text-[#333]">14.2-inch Liquid Retina XDR</span>
            </div>
            <div className="flex justify-between px-4 py-2 rounded-lg bg-white" style={{ border: "1px solid rgba(0,0,0,0.05)" }}>
              <span className="text-[#666]">Storage</span>
              <span className="font-medium text-[#333]">512 GB SSD</span>
            </div>
          </div>

          <div className="mt-5 flex gap-3">
            <button
              onClick={onClose}
              className="rounded-lg bg-[#007aff] px-5 py-1.5 text-[13px] font-medium text-white hover:bg-[#0066dd] transition-colors"
            >
              OK
            </button>
          </div>

          <p className="mt-4 text-[11px] text-[#bbb]">
            Built with Next.js - A web-based macOS experience
          </p>
        </div>
      </div>
    </div>
  )
}
