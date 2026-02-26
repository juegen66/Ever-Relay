import type { AppId } from "@/app/desktop/components/macos/types"

export const APP_IDS: AppId[] = [
  "finder",
  "calculator",
  "notes",
  "terminal",
  "safari",
  "settings",
  "photos",
  "music",
  "calendar",
  "mail",
  "weather",
  "clock",
  "maps",
  "appstore",
  "messages",
  "canvas",
  "textedit",
]

export function toAppId(value: string): AppId | null {
  if ((APP_IDS as string[]).includes(value)) {
    return value as AppId
  }
  return null
}
