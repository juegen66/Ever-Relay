"use client"

import { useEffect } from "react"

import { X } from "lucide-react"

export interface NotificationItem {
  id: string
  app: string
  title: string
  message: string
  time: string
  iconColor: string
}

interface NotificationPopupProps {
  notification: NotificationItem
  onDismiss: () => void
}

export function NotificationPopup({ notification, onDismiss }: NotificationPopupProps) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 5000)
    return () => clearTimeout(timer)
  }, [onDismiss])

  return (
    <div className="fixed top-8 right-3 z-[10003] w-[340px] animate-notify-in">
      <div
        className="flex items-start gap-3 rounded-2xl p-3.5 cursor-pointer"
        style={{
          background: "rgba(242, 242, 242, 0.92)",
          backdropFilter: "blur(50px) saturate(180%)",
          WebkitBackdropFilter: "blur(50px) saturate(180%)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.18), 0 0 0 0.5px rgba(0,0,0,0.08)",
        }}
        onClick={onDismiss}
      >
        <div
          className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-[14px] font-bold text-white"
          style={{ background: notification.iconColor }}
        >
          {notification.app.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[12px] font-semibold text-[#333] uppercase tracking-wide">
              {notification.app}
            </span>
            <span className="text-[11px] text-[#999] flex-shrink-0">{notification.time}</span>
          </div>
          <div className="text-[13px] font-semibold text-[#333] mt-0.5">{notification.title}</div>
          <div className="text-[12px] text-[#666] mt-0.5 line-clamp-2">{notification.message}</div>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onDismiss() }}
          className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-black/10 text-[#666] hover:bg-black/20"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    </div>
  )
}
