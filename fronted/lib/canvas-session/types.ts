export interface CanvasProjectCandidate {
  id: string
  title: string
}

export interface CanvasSessionOpenProjectResult {
  ok: boolean
  error?: string
}

export interface CanvasSessionFindByNameSuccessResult {
  ok: true
  projectId: string
}

export interface CanvasSessionFindByNameFailureResult {
  ok: false
  error: string
  candidates?: CanvasProjectCandidate[]
}

export type CanvasSessionFindByNameResult =
  | CanvasSessionFindByNameSuccessResult
  | CanvasSessionFindByNameFailureResult

export interface CanvasSessionInsertSvgResult {
  ok: boolean
  error?: string
  insertedObjectCount?: number
  projectId?: string
}

export interface CanvasSession {
  openProjectById: (projectId: string) => Promise<CanvasSessionOpenProjectResult>
  findProjectByName: (projectName: string) => Promise<CanvasSessionFindByNameResult>
  getActiveProjectId: () => string | null
  insertSvg: (args: { svg: string; scale?: number }) => Promise<CanvasSessionInsertSvgResult>
}

export interface OpenCanvasProjectArgs {
  projectId?: string
  projectName?: string
}

export interface OpenCanvasProjectSuccessResult {
  ok: true
  projectId: string
}

export interface OpenCanvasProjectFailureResult {
  ok: false
  error: string
  candidates?: CanvasProjectCandidate[]
}

export type OpenCanvasProjectResult =
  | OpenCanvasProjectSuccessResult
  | OpenCanvasProjectFailureResult

export interface InsertSvgToActiveCanvasArgs {
  svg: string
  scale?: number
}

export interface InsertSvgToActiveCanvasSuccessResult {
  ok: true
  projectId: string
  insertedObjectCount: number
}

export interface InsertSvgToActiveCanvasFailureResult {
  ok: false
  error: string
}

export type InsertSvgToActiveCanvasResult =
  | InsertSvgToActiveCanvasSuccessResult
  | InsertSvgToActiveCanvasFailureResult
