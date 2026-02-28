"use client"

import type {
  CanvasSession,
  InsertSvgToActiveCanvasArgs,
  InsertSvgToActiveCanvasResult,
  OpenCanvasProjectArgs,
  OpenCanvasProjectResult,
} from "./types"

export type {
  CanvasProjectCandidate,
  CanvasSession,
  CanvasSessionFindByNameFailureResult,
  CanvasSessionFindByNameResult,
  CanvasSessionFindByNameSuccessResult,
  CanvasSessionInsertSvgResult,
  CanvasSessionOpenProjectResult,
  InsertSvgToActiveCanvasArgs,
  InsertSvgToActiveCanvasFailureResult,
  InsertSvgToActiveCanvasResult,
  InsertSvgToActiveCanvasSuccessResult,
  OpenCanvasProjectArgs,
  OpenCanvasProjectFailureResult,
  OpenCanvasProjectResult,
  OpenCanvasProjectSuccessResult,
} from "./types"

let activeCanvasSession: CanvasSession | null = null
const readyWaiters = new Set<(ready: boolean) => void>()

function notifyReadyWaiters(ready: boolean) {
  for (const waiter of [...readyWaiters]) {
    waiter(ready)
  }
}

export function registerCanvasSession(session: CanvasSession) {
  activeCanvasSession = session
  notifyReadyWaiters(true)
}

export function unregisterCanvasSession(session?: CanvasSession) {
  if (session && activeCanvasSession !== session) {
    return
  }

  activeCanvasSession = null
  notifyReadyWaiters(false)
}

export function isCanvasSessionReady() {
  return activeCanvasSession !== null
}

export function getActiveCanvasProjectId() {
  return activeCanvasSession?.getActiveProjectId() ?? null
}

export async function waitForCanvasSessionReady(timeoutMs = 2500): Promise<boolean> {
  if (isCanvasSessionReady()) {
    return true
  }

  return new Promise<boolean>((resolve) => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null

    const finalize = (ready: boolean) => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      readyWaiters.delete(finalize)
      resolve(ready)
    }

    readyWaiters.add(finalize)
    timeoutId = setTimeout(() => finalize(false), timeoutMs)
  })
}

export async function openCanvasProjectInSession(args: OpenCanvasProjectArgs): Promise<OpenCanvasProjectResult> {
  const projectId = typeof args.projectId === "string" ? args.projectId.trim() : ""
  const projectName = typeof args.projectName === "string" ? args.projectName.trim() : ""

  if (!projectId && !projectName) {
    return {
      ok: false,
      error: "projectId or projectName is required",
    }
  }

  if (!activeCanvasSession) {
    return {
      ok: false,
      error: "Canvas app is not ready yet",
    }
  }

  if (projectId) {
    const opened = await activeCanvasSession.openProjectById(projectId)
    if (!opened.ok) {
      return {
        ok: false,
        error: opened.error ?? `Failed to open canvas project: ${projectId}`,
      }
    }

    return {
      ok: true,
      projectId,
    }
  }

  const resolved = await activeCanvasSession.findProjectByName(projectName)
  if (!resolved.ok) {
    return {
      ok: false,
      error: resolved.error,
      candidates: resolved.candidates,
    }
  }

  const opened = await activeCanvasSession.openProjectById(resolved.projectId)
  if (!opened.ok) {
    return {
      ok: false,
      error: opened.error ?? `Failed to open canvas project: ${resolved.projectId}`,
    }
  }

  return {
    ok: true,
    projectId: resolved.projectId,
  }
}

export async function insertSvgIntoActiveCanvasSession(
  args: InsertSvgToActiveCanvasArgs
): Promise<InsertSvgToActiveCanvasResult> {
  const svg = typeof args.svg === "string" ? args.svg.trim() : ""
  if (!svg) {
    return {
      ok: false,
      error: "svg is required",
    }
  }

  if (!activeCanvasSession) {
    return {
      ok: false,
      error: "Canvas app is not ready yet",
    }
  }

  const inserted = await activeCanvasSession.insertSvg({
    svg,
    scale: args.scale,
  })

  if (!inserted.ok) {
    return {
      ok: false,
      error: inserted.error ?? "Failed to insert SVG into canvas",
    }
  }

  if (!inserted.projectId || inserted.insertedObjectCount === undefined) {
    return {
      ok: false,
      error: "Canvas session did not return insertion metadata",
    }
  }

  return {
    ok: true,
    projectId: inserted.projectId,
    insertedObjectCount: inserted.insertedObjectCount,
  }
}
