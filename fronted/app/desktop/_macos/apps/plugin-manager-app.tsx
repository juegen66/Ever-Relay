"use client"

import { startTransition, useDeferredValue, useMemo, useState } from "react"

import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Globe,
  Loader2,
  Puzzle,
  Server,
  Shield,
  Trash2,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ApiError } from "@/lib/api"
import type {
  ThirdPartyAppConfig,
  UpdateThirdPartyAppBody,
} from "@/lib/api/modules/third-party-apps"
import type { ThirdPartyMcpBinding } from "@/lib/api/modules/third-party-mcp"
import {
  useCreateThirdPartyAppMutation,
  useDeleteThirdPartyAppMutation,
  useDeleteThirdPartyMcpBindingMutation,
  useThirdPartyAppsQuery,
  useThirdPartyMcpBindingQuery,
  useUpsertThirdPartyMcpBindingMutation,
  useUpdateThirdPartyAppMutation,
} from "@/lib/query/third-party-apps"
import { cn } from "@/lib/utils"

type FeedbackState = {
  tone: "success" | "error"
  message: string
}

type AuthType = "none" | "bearer"

type PluginDraft = {
  displayName: string
  websiteUrl: string
}

type McpDraft = {
  serverUrl: string
  authType: AuthType
  authToken: string
}

const EMPTY_APPS: ThirdPartyAppConfig[] = []
const EMPTY_MCP_DRAFT: McpDraft = { serverUrl: "", authType: "none", authToken: "" }

function formatErrorMessage(error: unknown) {
  if (error instanceof ApiError) return error.message
  if (error instanceof Error && error.message.trim()) return error.message
  return "Unknown error"
}

function deriveOrigin(value: string) {
  const normalized = value.trim()
  if (!normalized) return null

  try {
    return new URL(normalized).origin
  } catch {
    return null
  }
}

function isPluginConfigured(websiteUrl: string | null) {
  return Boolean(websiteUrl?.trim())
}

function FeedbackBanner({ feedback }: { feedback: FeedbackState | null }) {
  if (!feedback) return null

  return (
    <div
      className={cn(
        "flex items-start gap-2 rounded-xl border px-3 py-2 text-sm",
        feedback.tone === "success"
          ? "border-emerald-200 bg-emerald-50 text-emerald-900"
          : "border-rose-200 bg-rose-50 text-rose-900"
      )}
    >
      {feedback.tone === "success" ? (
        <CheckCircle2 className="mt-0.5 h-4 w-4 flex-none" />
      ) : (
        <AlertCircle className="mt-0.5 h-4 w-4 flex-none" />
      )}
      <p>{feedback.message}</p>
    </div>
  )
}

function PluginDetailsLoading() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="rounded-[28px] border border-black/6 bg-white/70 px-8 py-10 text-center shadow-[0_20px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl">
        <Loader2 className="mx-auto h-6 w-6 animate-spin text-[#0f766e]" />
        <p className="mt-4 text-sm text-[#66727f]">Loading MCP binding...</p>
      </div>
    </div>
  )
}

function PluginDetails({
  app,
  mcpBinding,
  mcpBindingError,
  onArchived,
}: {
  app: ThirdPartyAppConfig
  mcpBinding: ThirdPartyMcpBinding | null
  mcpBindingError: string | null
  onArchived: () => void
}) {
  const [pluginDraft, setPluginDraft] = useState<PluginDraft>({
    displayName: app.displayName,
    websiteUrl: app.websiteUrl ?? "",
  })
  const [mcpDraft, setMcpDraft] = useState<McpDraft>({
    serverUrl: mcpBinding?.serverUrl ?? "",
    authType: mcpBinding?.authType ?? "none",
    authToken: "",
  })
  const [pluginFeedback, setPluginFeedback] = useState<FeedbackState | null>(null)
  const [mcpFeedback, setMcpFeedback] = useState<FeedbackState | null>(null)

  const updateAppMutation = useUpdateThirdPartyAppMutation()
  const deleteAppMutation = useDeleteThirdPartyAppMutation()
  const upsertBindingMutation = useUpsertThirdPartyMcpBindingMutation()
  const deleteBindingMutation = useDeleteThirdPartyMcpBindingMutation()

  const selectedOrigin = deriveOrigin(pluginDraft.websiteUrl)
  const websiteChanged = pluginDraft.websiteUrl.trim() !== (app.websiteUrl ?? "")
  const websiteChangeIsValid = !websiteChanged || pluginDraft.websiteUrl.trim().length > 0
  const pluginDirty =
    pluginDraft.displayName.trim() !== app.displayName ||
    pluginDraft.websiteUrl.trim() !== (app.websiteUrl ?? "")

  const mcpDirty =
    mcpDraft.serverUrl.trim() !== (mcpBinding?.serverUrl ?? "") ||
    mcpDraft.authType !== (mcpBinding?.authType ?? "none") ||
    mcpDraft.authToken.trim().length > 0

  const canSavePlugin =
    pluginDraft.displayName.trim().length > 0 && websiteChangeIsValid && pluginDirty

  const canSaveMcp =
    mcpDraft.serverUrl.trim().length > 0 &&
    mcpDirty &&
    (mcpDraft.authType === "none" ||
      mcpDraft.authToken.trim().length > 0 ||
      Boolean(mcpBinding?.hasAuthToken))

  const handleSavePlugin = async () => {
    setPluginFeedback(null)

    try {
      const body: UpdateThirdPartyAppBody = {}

      if (pluginDraft.displayName.trim() !== app.displayName) {
        body.displayName = pluginDraft.displayName.trim()
      }

      if (pluginDraft.websiteUrl.trim() !== (app.websiteUrl ?? "")) {
        body.websiteUrl = pluginDraft.websiteUrl.trim()
      }

      const updated = await updateAppMutation.mutateAsync({
        appSlug: app.appSlug,
        body,
      })

      setPluginDraft({
        displayName: updated.displayName,
        websiteUrl: updated.websiteUrl ?? "",
      })
      setPluginFeedback({
        tone: "success",
        message: `${updated.displayName} is now routed to ${updated.websiteUrl ?? "its saved URL"}.`,
      })
    } catch (error) {
      setPluginFeedback({
        tone: "error",
        message: formatErrorMessage(error),
      })
    }
  }

  const handleSaveMcp = async () => {
    setMcpFeedback(null)

    try {
      const binding = await upsertBindingMutation.mutateAsync({
        appSlug: app.appSlug,
        body: {
          serverUrl: mcpDraft.serverUrl.trim(),
          authType: mcpDraft.authType,
          authToken:
            mcpDraft.authType === "bearer" && mcpDraft.authToken.trim()
              ? mcpDraft.authToken.trim()
              : undefined,
        },
      })

      setMcpDraft({
        serverUrl: binding.serverUrl,
        authType: binding.authType,
        authToken: "",
      })
      setMcpFeedback({
        tone: "success",
        message:
          binding.authType === "bearer"
            ? "MCP binding saved with bearer authentication."
            : "MCP binding saved without authentication.",
      })
    } catch (error) {
      setMcpFeedback({
        tone: "error",
        message: formatErrorMessage(error),
      })
    }
  }

  const handleDeleteBinding = async () => {
    if (!mcpBinding) return

    const confirmed = window.confirm(`Remove the MCP binding for ${app.displayName}?`)
    if (!confirmed) return

    setMcpFeedback(null)

    try {
      await deleteBindingMutation.mutateAsync(app.appSlug)
      setMcpDraft(EMPTY_MCP_DRAFT)
      setMcpFeedback({
        tone: "success",
        message: "MCP binding removed.",
      })
    } catch (error) {
      setMcpFeedback({
        tone: "error",
        message: formatErrorMessage(error),
      })
    }
  }

  const handleArchivePlugin = async () => {
    const confirmed = window.confirm(
      `Archive ${app.displayName}? The slug will stay reserved for your account.`
    )

    if (!confirmed) return

    setPluginFeedback(null)

    try {
      await deleteAppMutation.mutateAsync(app.appSlug)
      onArchived()
    } catch (error) {
      setPluginFeedback({
        tone: "error",
        message: formatErrorMessage(error),
      })
    }
  }

  return (
    <div className="space-y-5">
      <div className="rounded-[28px] border border-black/6 bg-white/65 px-6 py-5 shadow-[0_18px_44px_rgba(15,23,42,0.08)] backdrop-blur-xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-[28px] font-semibold tracking-[-0.03em] text-[#16202a]">
                {app.displayName}
              </h3>
              <Badge
                variant="outline"
                className={cn(
                  "border-none px-2.5 py-1 text-[11px]",
                  isPluginConfigured(app.websiteUrl)
                    ? "bg-emerald-100 text-emerald-900"
                    : "bg-amber-100 text-amber-900"
                )}
              >
                {isPluginConfigured(app.websiteUrl) ? "Launchable" : "Draft"}
              </Badge>
              <Badge
                variant="outline"
                className={cn(
                  "border-none px-2.5 py-1 text-[11px]",
                  mcpBinding ? "bg-sky-100 text-sky-900" : "bg-slate-100 text-slate-700"
                )}
              >
                {mcpBinding ? "MCP linked" : "No MCP"}
              </Badge>
            </div>
            <p className="mt-2 font-mono text-[13px] text-[#7b8794]">{app.appSlug}</p>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#66727f]">
              Save the iframe website URL under Plugin, then add the MCP server URL under MCP.
              `allowedOrigins` is derived from the website origin automatically.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              void handleArchivePlugin()
            }}
            disabled={deleteAppMutation.isPending}
            className="rounded-xl border-rose-200 bg-white/80 text-rose-700 hover:bg-rose-50 hover:text-rose-800"
          >
            {deleteAppMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            Archive Plugin
          </Button>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-5">
          <Card className="rounded-[26px] border-black/6 bg-white/72 shadow-[0_18px_44px_rgba(15,23,42,0.07)] backdrop-blur-xl">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,_rgba(15,118,110,0.12),_rgba(59,130,246,0.08))] text-[#0f766e]">
                  <Globe className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-[20px] tracking-[-0.02em] text-[#16202a]">
                    Plugin
                  </CardTitle>
                  <CardDescription className="mt-1 text-sm text-[#66727f]">
                    The public website loaded into the desktop iframe.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <FeedbackBanner feedback={pluginFeedback} />

              <div className="space-y-2">
                <Label htmlFor={`plugin-display-name-${app.id}`}>Display name</Label>
                <Input
                  id={`plugin-display-name-${app.id}`}
                  value={pluginDraft.displayName}
                  onChange={(event) =>
                    setPluginDraft((current) => ({
                      ...current,
                      displayName: event.target.value,
                    }))
                  }
                  className="border-black/10 bg-white/95"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`plugin-website-url-${app.id}`}>Website URL</Label>
                <Input
                  id={`plugin-website-url-${app.id}`}
                  value={pluginDraft.websiteUrl}
                  onChange={(event) =>
                    setPluginDraft((current) => ({
                      ...current,
                      websiteUrl: event.target.value,
                    }))
                  }
                  placeholder="https://plugin.example.com/index.html"
                  className="border-black/10 bg-white/95"
                />
                <p className="text-[12px] leading-5 text-[#738091]">
                  The desktop loads this exact URL into an iframe and appends
                  `everrelayWindowId` at runtime.
                </p>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl border border-black/8 bg-[#f7faf9] p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#7a8576]">
                    Derived origin
                  </p>
                  <p className="mt-2 break-all font-mono text-[13px] text-[#18322d]">
                    {selectedOrigin ?? "Waiting for a valid absolute URL"}
                  </p>
                </div>
                <div className="rounded-2xl border border-black/8 bg-[#fbf8f2] p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8b7355]">
                    Current route
                  </p>
                  <p className="mt-2 break-all font-mono text-[13px] text-[#3b2d1a]">
                    {app.websiteUrl ?? "Not saved yet"}
                  </p>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={() => {
                    void handleSavePlugin()
                  }}
                  disabled={!canSavePlugin || updateAppMutation.isPending}
                  className="rounded-xl bg-[#0f766e] text-white hover:bg-[#115e59]"
                >
                  {updateAppMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : null}
                  Save Plugin
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[26px] border-black/6 bg-white/72 shadow-[0_18px_44px_rgba(15,23,42,0.07)] backdrop-blur-xl">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,_rgba(180,83,9,0.14),_rgba(15,118,110,0.08))] text-[#9a5c00]">
                  <Server className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-[20px] tracking-[-0.02em] text-[#16202a]">
                    MCP
                  </CardTitle>
                  <CardDescription className="mt-1 text-sm text-[#66727f]">
                    Optional server binding for tools exposed behind your plugin.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <FeedbackBanner feedback={mcpFeedback} />
              <FeedbackBanner
                feedback={
                  mcpBindingError
                    ? {
                        tone: "error",
                        message: mcpBindingError,
                      }
                    : null
                }
              />

              <div className="space-y-2">
                <Label htmlFor={`plugin-mcp-url-${app.id}`}>MCP server URL</Label>
                <Input
                  id={`plugin-mcp-url-${app.id}`}
                  value={mcpDraft.serverUrl}
                  onChange={(event) =>
                    setMcpDraft((current) => ({
                      ...current,
                      serverUrl: event.target.value,
                    }))
                  }
                  placeholder="https://mcp.example.com"
                  className="border-black/10 bg-white/95"
                />
                <p className="text-[12px] leading-5 text-[#738091]">
                  Uses the same backend validation rules as the current MCP test flow.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Auth type</Label>
                  <Select
                    value={mcpDraft.authType}
                    onValueChange={(value) =>
                      setMcpDraft((current) => ({
                        ...current,
                        authType: value as AuthType,
                        authToken: value === "bearer" ? current.authToken : "",
                      }))
                    }
                  >
                    <SelectTrigger className="border-black/10 bg-white/95">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="bearer">Bearer token</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`plugin-mcp-token-${app.id}`}>
                    Auth token
                    {mcpDraft.authType === "bearer" ? " (optional if already saved)" : ""}
                  </Label>
                  <Input
                    id={`plugin-mcp-token-${app.id}`}
                    type="password"
                    value={mcpDraft.authToken}
                    onChange={(event) =>
                      setMcpDraft((current) => ({
                        ...current,
                        authToken: event.target.value,
                      }))
                    }
                    disabled={mcpDraft.authType !== "bearer"}
                    placeholder={
                      mcpBinding?.hasAuthToken && mcpDraft.authType === "bearer"
                        ? "Leave blank to keep current token"
                        : "Bearer token"
                    }
                    className="border-black/10 bg-white/95"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-[12px] text-[#66727f]">
                  <Shield className="h-4 w-4 text-[#0f766e]" />
                  {mcpBinding?.hasAuthToken
                    ? "A token is already stored for this plugin."
                    : "No token stored."}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      void handleDeleteBinding()
                    }}
                    disabled={!mcpBinding || deleteBindingMutation.isPending}
                    className="rounded-xl border-black/10 bg-white/85"
                  >
                    {deleteBindingMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                    Remove Binding
                  </Button>
                  <Button
                    onClick={() => {
                      void handleSaveMcp()
                    }}
                    disabled={!canSaveMcp || upsertBindingMutation.isPending}
                    className="rounded-xl bg-[#b45309] text-white hover:bg-[#92400e]"
                  >
                    {upsertBindingMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : null}
                    Save MCP
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-5">
          <Card className="rounded-[26px] border-black/6 bg-white/72 shadow-[0_18px_44px_rgba(15,23,42,0.07)] backdrop-blur-xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-[18px] tracking-[-0.02em] text-[#16202a]">
                Runtime contract
              </CardTitle>
              <CardDescription className="text-sm text-[#66727f]">
                What the desktop will inject and validate for this plugin.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-[#445160]">
              <div className="rounded-2xl border border-black/8 bg-[#f8fafc] p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#7b8794]">
                  Iframe param
                </p>
                <p className="mt-2 font-mono text-[13px] text-[#13202d]">everrelayWindowId</p>
              </div>
              <div className="rounded-2xl border border-black/8 bg-[#f8fafc] p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#7b8794]">
                  RPC channel
                </p>
                <p className="mt-2 font-mono text-[13px] text-[#13202d]">
                  everrelay:plugin:rpc
                </p>
              </div>
              <div className="rounded-2xl border border-black/8 bg-[#f8fafc] p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#7b8794]">
                  Allowed origin
                </p>
                <p className="mt-2 break-all font-mono text-[13px] text-[#13202d]">
                  {selectedOrigin ?? app.allowedOrigins[0] ?? "Not available yet"}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[26px] border-black/6 bg-white/72 shadow-[0_18px_44px_rgba(15,23,42,0.07)] backdrop-blur-xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-[18px] tracking-[-0.02em] text-[#16202a]">
                Notes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-6 text-[#5d6874]">
              <p>
                The website URL is stored separately from the MCP binding. Save Plugin and Save MCP
                independently.
              </p>
              <p>
                `allowedOrigins` is always derived from the website URL origin. v1 does not expose
                a manual override here.
              </p>
              <p>
                If the iframe is hosted on a public domain, the remote site must still allow
                embedding via `frame-ancestors` or equivalent headers.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export function PluginManagerApp() {
  const appsQuery = useThirdPartyAppsQuery()
  const createAppMutation = useCreateThirdPartyAppMutation()

  const [selectedAppSlug, setSelectedAppSlug] = useState<string | null>(null)
  const [searchText, setSearchText] = useState("")
  const [createDisplayName, setCreateDisplayName] = useState("")
  const [createAppSlug, setCreateAppSlug] = useState("")
  const [createFeedback, setCreateFeedback] = useState<FeedbackState | null>(null)

  const deferredSearchText = useDeferredValue(searchText)
  const apps = appsQuery.data ?? EMPTY_APPS
  const filteredApps = useMemo(() => {
    const query = deferredSearchText.trim().toLowerCase()
    if (!query) return apps

    return apps.filter((app) => {
      const haystack = `${app.displayName} ${app.appSlug}`.toLowerCase()
      return haystack.includes(query)
    })
  }, [apps, deferredSearchText])

  const selectedApp =
    apps.find((app) => app.appSlug === selectedAppSlug) ??
    apps[0] ??
    null

  const selectedAppVisibleInList = filteredApps.some(
    (app) => app.appSlug === selectedApp?.appSlug
  )

  const mcpBindingQuery = useThirdPartyMcpBindingQuery(selectedApp?.appSlug ?? null)

  const handleCreateApp = async () => {
    setCreateFeedback(null)

    try {
      const app = await createAppMutation.mutateAsync({
        displayName: createDisplayName,
        appSlug: createAppSlug,
      })

      setCreateDisplayName("")
      setCreateAppSlug("")
      setCreateFeedback({
        tone: "success",
        message: `Created ${app.displayName}. Add a website URL to make it launchable.`,
      })
      startTransition(() => {
        setSelectedAppSlug(app.appSlug)
      })
    } catch (error) {
      setCreateFeedback({
        tone: "error",
        message: formatErrorMessage(error),
      })
    }
  }

  return (
    <div className="h-full overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.75),_transparent_38%),linear-gradient(180deg,_rgba(244,238,229,0.9),_rgba(237,243,247,0.94))] text-[#1f2937]">
      <div className="grid h-full grid-cols-[320px_minmax(0,1fr)] gap-0">
        <aside className="flex h-full flex-col border-r border-black/8 bg-white/45 backdrop-blur-xl">
          <div className="border-b border-black/8 px-5 pb-4 pt-5">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,_#b45309,_#0f766e)] text-white shadow-[0_16px_40px_rgba(15,118,110,0.18)]">
                <Puzzle className="h-5 w-5" strokeWidth={2.4} />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8b7355]">
                  Third-Party Apps
                </p>
                <h2 className="mt-1 text-[24px] font-semibold tracking-[-0.02em] text-[#16202a]">
                  Plugin Manager
                </h2>
                <p className="mt-1 text-sm leading-6 text-[#5d6874]">
                  Register a website URL for the iframe app, then bind its MCP server separately.
                </p>
              </div>
            </div>
          </div>

          <div className="border-b border-black/8 px-5 py-4">
            <div className="space-y-3 rounded-2xl border border-black/6 bg-white/70 p-4 shadow-[0_12px_32px_rgba(15,23,42,0.06)]">
              <div className="space-y-1">
                <Label htmlFor="plugin-name">Create plugin</Label>
                <Input
                  id="plugin-name"
                  value={createDisplayName}
                  onChange={(event) => setCreateDisplayName(event.target.value)}
                  placeholder="Demo Weather"
                  className="border-black/10 bg-white/90"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="plugin-slug">Stable slug</Label>
                <Input
                  id="plugin-slug"
                  value={createAppSlug}
                  onChange={(event) => setCreateAppSlug(event.target.value)}
                  placeholder="demo_weather"
                  className="border-black/10 bg-white/90 font-mono text-[13px]"
                />
                <p className="text-[12px] text-[#738091]">
                  Letters, numbers, `_` and `-` only. Keep this stable after launch.
                </p>
              </div>
              <Button
                onClick={() => {
                  void handleCreateApp()
                }}
                disabled={
                  createAppMutation.isPending ||
                  createDisplayName.trim().length === 0 ||
                  createAppSlug.trim().length === 0
                }
                className="w-full rounded-xl bg-[#0f766e] text-white hover:bg-[#115e59]"
              >
                {createAppMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : null}
                Create Plugin
              </Button>
              <FeedbackBanner feedback={createFeedback} />
            </div>
          </div>

          <div className="px-5 pb-3 pt-4">
            <Input
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              placeholder="Search plugins"
              className="border-black/10 bg-white/85"
            />
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-4">
            {appsQuery.isLoading ? (
              <div className="flex h-full items-center justify-center text-sm text-[#66727f]">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading plugins...
              </div>
            ) : appsQuery.isError ? (
              <div className="mx-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
                {formatErrorMessage(appsQuery.error)}
              </div>
            ) : filteredApps.length === 0 ? (
              <div className="mx-2 rounded-2xl border border-dashed border-black/10 bg-white/55 px-4 py-5 text-sm text-[#66727f]">
                {apps.length === 0
                  ? "No plugins yet. Create the first one above."
                  : "No plugin matched that search."}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredApps.map((app) => {
                  const configured = isPluginConfigured(app.websiteUrl)
                  const isSelected =
                    selectedAppVisibleInList && app.appSlug === selectedApp?.appSlug

                  return (
                    <button
                      key={app.id}
                      onClick={() => {
                        startTransition(() => {
                          setSelectedAppSlug(app.appSlug)
                        })
                      }}
                      className={cn(
                        "w-full rounded-2xl border px-4 py-3 text-left transition",
                        isSelected
                          ? "border-[#0f766e]/25 bg-[linear-gradient(135deg,_rgba(15,118,110,0.12),_rgba(180,83,9,0.08))] shadow-[0_14px_32px_rgba(15,118,110,0.12)]"
                          : "border-black/6 bg-white/60 hover:border-black/10 hover:bg-white/80"
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-[15px] font-semibold text-[#13202d]">
                            {app.displayName}
                          </p>
                          <p className="mt-1 truncate font-mono text-[12px] text-[#7b8794]">
                            {app.appSlug}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className={cn(
                            "border-none px-2.5 py-1 text-[11px]",
                            configured
                              ? "bg-emerald-100 text-emerald-900"
                              : "bg-amber-100 text-amber-900"
                          )}
                        >
                          {configured ? "Launchable" : "Needs URL"}
                        </Badge>
                      </div>
                      <div className="mt-3 flex items-center gap-2 text-[11px] text-[#6f7d8c]">
                        <span>{app.allowedOrigins[0] ?? "No origin saved yet"}</span>
                        {app.websiteUrl ? (
                          <a
                            href={app.websiteUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[#0f766e]"
                            onClick={(event) => event.stopPropagation()}
                          >
                            Open
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : null}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </aside>

        <main className="min-w-0 overflow-y-auto p-6">
          {!selectedApp ? (
            <div className="flex h-full items-center justify-center">
              <div className="max-w-md rounded-[28px] border border-black/6 bg-white/70 px-8 py-10 text-center shadow-[0_20px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,_rgba(180,83,9,0.14),_rgba(15,118,110,0.12))] text-[#0f766e]">
                  <Puzzle className="h-6 w-6" strokeWidth={2.3} />
                </div>
                <h3 className="mt-4 text-xl font-semibold text-[#16202a]">
                  Select or create a plugin
                </h3>
                <p className="mt-2 text-sm leading-6 text-[#66727f]">
                  A plugin becomes launchable after you save a website URL. MCP is optional and
                  configured independently.
                </p>
              </div>
            </div>
          ) : mcpBindingQuery.isPending ? (
            <PluginDetailsLoading />
          ) : (
            <PluginDetails
              app={selectedApp}
              mcpBinding={mcpBindingQuery.data ?? null}
              mcpBindingError={mcpBindingQuery.isError ? formatErrorMessage(mcpBindingQuery.error) : null}
              onArchived={() => {
                startTransition(() => {
                  setSelectedAppSlug(null)
                })
              }}
            />
          )}
        </main>
      </div>
    </div>
  )
}
