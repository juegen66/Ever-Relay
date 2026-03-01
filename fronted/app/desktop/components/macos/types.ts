export type AppId =
  | "finder"
  | "canvas"
  | "logo"
  | "vibecoding"
  | "textedit"

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
  fileId?: string
  fileName?: string
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
