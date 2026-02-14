export type AppId =
  | "finder"
  | "calculator"
  | "notes"
  | "terminal"
  | "safari"
  | "settings"
  | "photos"

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
}

export interface AppInfo {
  id: AppId
  name: string
  icon: React.ReactNode
}
