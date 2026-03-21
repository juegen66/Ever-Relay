import type { AppId, BuiltinAppId } from "@/lib/desktop/types"
import { isThirdPartyAppId } from "@/lib/third-party-app/types"

export const BUILTIN_APP_IDS: BuiltinAppId[] = [
  "finder",
  "canvas",
  "logo",
  "vibecoding",
  "textedit",
  "report",
]

/** @deprecated Use BUILTIN_APP_IDS */
export const APP_IDS = BUILTIN_APP_IDS

export function toAppId(value: string): AppId | null {
  if ((BUILTIN_APP_IDS as string[]).includes(value)) {
    return value as BuiltinAppId
  }
  if (isThirdPartyAppId(value)) {
    return value
  }
  return null
}
