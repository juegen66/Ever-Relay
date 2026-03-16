import type { ReactNode } from "react"

import type { AppId } from "@/lib/desktop/types"

export type { AppId, WindowState } from "@/lib/desktop/types"

export interface AppInfo {
  id: AppId
  name: string
  icon: ReactNode
}

export interface Notification {
  id: string
  appId: AppId
  title: string
  message: string
  time: Date
}
