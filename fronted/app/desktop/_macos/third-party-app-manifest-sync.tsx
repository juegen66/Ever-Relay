"use client"

import { useEffect, useMemo } from "react"

import { useThirdPartyAppsQuery } from "@/lib/query/third-party-apps"
import { useThirdPartyAppRegistry } from "@/lib/third-party-app/registry"
import type { ThirdPartyAppManifest } from "@/lib/third-party-app/types"

function toManagedManifest(app: {
  appSlug: string
  displayName: string
  websiteUrl: string | null
  allowedOrigins: string[]
}): ThirdPartyAppManifest | null {
  if (!app.websiteUrl) return null

  let hostname = "remote plugin"

  try {
    hostname = new URL(app.websiteUrl).hostname
  } catch {}

  return {
    slug: app.appSlug,
    displayName: app.displayName,
    description: `Developer-configured plugin loaded from ${hostname}.`,
    source: {
      type: "url",
      url: app.websiteUrl,
    },
    allowedOrigins: app.allowedOrigins,
    defaultSize: { w: 460, h: 620 },
  }
}

export function ThirdPartyAppManifestSync() {
  const appsQuery = useThirdPartyAppsQuery()
  const syncManagedManifests = useThirdPartyAppRegistry((state) => state.syncManagedManifests)

  const managedManifests = useMemo(
    () =>
      (appsQuery.data ?? [])
        .map((app) => toManagedManifest(app))
        .filter((manifest): manifest is ThirdPartyAppManifest => manifest !== null),
    [appsQuery.data]
  )

  useEffect(() => {
    if (!appsQuery.isSuccess) return
    syncManagedManifests(managedManifests)
  }, [appsQuery.isSuccess, managedManifests, syncManagedManifests])

  return null
}
