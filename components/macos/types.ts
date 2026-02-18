export type AppId =
  | "finder"
  | "calculator"
  | "notes"
  | "terminal"
  | "safari"
  | "settings"
  | "photos"
  | "music"
  | "calendar"
  | "mail"
  | "weather"
  | "clock"
  | "maps"
  | "appstore"
  | "messages"

export interface WindowState {
  id: string
  appId: AppId
  x: number
  y: number
  width: number
  height: number
  zIndex: number
  minimized: boolean
  maximized: boolean
  prevBounds?: { x: number; y: number; width: number; height: number }
  folderId?: string
  folderName?: string
}

export interface AppInfo {
  id: AppId
  name: string
  icon: React.ReactNode
}

export interface Notification {
  id: string
  appId: AppId
  title: string
  message: string
  time: Date
}
