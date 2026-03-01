export type AppId = "finder" | "canvas" | "logo" | "vibecoding" | "textedit"

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
