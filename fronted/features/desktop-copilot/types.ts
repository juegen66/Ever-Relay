import type { AppId } from "@/lib/desktop/types"

export const APP_IDS: AppId[] = [
  "finder",
  "canvas",
  "logo",
  "vibecoding",
  "textedit",
]

export function toAppId(value: string): AppId | null {
  if ((APP_IDS as string[]).includes(value)) {
    return value as AppId
  }
  return null
}
