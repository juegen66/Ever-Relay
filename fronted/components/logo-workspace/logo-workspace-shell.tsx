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
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden bg-[#f5f5f4] p-3">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(95,91,230,0.06),transparent_32%),linear-gradient(180deg,rgba(255,255,255,0.62)_0%,rgba(245,245,244,0)_24%)]" />

      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-[18px] border border-[#e4e5e8] bg-[#fbfbfc]">
        {hideHeader ? null : <LogoWorkspaceHeader onRefresh={onRefresh} refreshing={refreshing} />}
        <div className="flex min-h-0 flex-1">
          <main className="min-w-0 flex-1 overflow-y-auto bg-[#f5f5f4]">
            {main}
          </main>
          {sidebar}
        </div>
      </div>
      <div className="pointer-events-none mx-auto mt-2 h-1.5 w-20 rounded-full bg-[#d9dadf]" />
    </div>
  )
}
