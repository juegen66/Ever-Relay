/** Built-in CloudOS apps */
export type BuiltinAppId =
  | "finder"
  | "canvas"
  | "logo"
  | "vibecoding"
  | "textedit"
  | "report"

/** Third-party iframe apps use ids `tp_<slug>`, e.g. tp_demo_weather */
export type ThirdPartyAppId = `tp_${string}`

export type AppId = BuiltinAppId | ThirdPartyAppId

export type DesktopItemType = "folder" | "text" | "image" | "code" | "spreadsheet" | "generic"

export interface DesktopFolder {
  id: string
  name: string
  x: number
  y: number
  isNew?: boolean
  itemType?: DesktopItemType
  parentId?: string | null
}

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
