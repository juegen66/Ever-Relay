"use client"

import type { ReactNode } from "react"

import { LogoWorkspaceHeader } from "@/components/logo-workspace/logo-workspace-header"

interface LogoWorkspaceShellProps {
  refreshing: boolean
  onRefresh: () => void
  main: ReactNode
  sidebar: ReactNode
  hideHeader?: boolean
}

export function LogoWorkspaceShell({
  refreshing,
  onRefresh,
  main,
  sidebar,
  hideHeader = false,
}: LogoWorkspaceShellProps) {
  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden bg-[linear-gradient(160deg,#becde0_0%,#dae5f0_48%,#cad8e8_100%)] p-3">
      <div className="pointer-events-none absolute -top-24 right-6 h-64 w-64 rounded-full bg-[#9bc3ff]/40 blur-3xl" />
      <div className="pointer-events-none absolute -left-20 bottom-10 h-72 w-72 rounded-full bg-[#b9d2ff]/45 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_22%_12%,rgba(255,255,255,0.42),transparent_40%),radial-gradient(circle_at_80%_92%,rgba(255,255,255,0.28),transparent_38%)]" />

      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-[18px] border border-white/55 bg-white/45 shadow-[0_24px_56px_rgba(14,29,53,0.24),inset_0_1px_0_rgba(255,255,255,0.85)] backdrop-blur-xl">
        {hideHeader ? null : <LogoWorkspaceHeader onRefresh={onRefresh} refreshing={refreshing} />}
        <div className="flex min-h-0 flex-1">
          <main className="min-w-0 flex-1 overflow-y-auto bg-[linear-gradient(180deg,rgba(255,255,255,0.26)_0%,rgba(255,255,255,0.12)_100%)]">
            {main}
          </main>
          {sidebar}
        </div>
      </div>
      <div className="pointer-events-none mx-auto mt-2 h-1.5 w-20 rounded-full bg-white/60 shadow-[0_1px_0_rgba(255,255,255,0.8),0_6px_18px_rgba(19,39,70,0.25)]" />
    </div>
  )
}
