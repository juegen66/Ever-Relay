"use client"

import type { AppId, BuiltinAppId } from "@/lib/desktop/types"
import { useThirdPartyAppRegistry } from "@/lib/third-party-app/registry"
import { isThirdPartyAppId, thirdPartySlugFromAppId } from "@/lib/third-party-app/types"

const BUILTIN_APP_DISPLAY_NAMES: Record<BuiltinAppId, string> = {
  finder: "Finder",
  canvas: "Canvas",
  logo: "Logo Studio",
  vibecoding: "Coding Apps",
  textedit: "TextEdit",
  report: "Predict Report",
  activity: "Agent Activity",
}

export function resolveAppDisplayName(appId: AppId): string {
  if (!isThirdPartyAppId(appId)) {
    return BUILTIN_APP_DISPLAY_NAMES[appId as BuiltinAppId] ?? appId
  }
  const slug = thirdPartySlugFromAppId(appId)
  if (slug) {
    const m = useThirdPartyAppRegistry.getState().getManifest(slug)
    if (m) return m.displayName
  }
  return appId
}
