export type ToolParameter = {
  name: string
  type?: "string" | "number" | "boolean" | "object" | "string[]" | "number[]" | "boolean[]" | "object[]"
  description?: string
  required?: boolean
}

export type ToolLifecycleStatus = "completed" | "blocked" | "retry_later"

export type ToolOutcomeMeta = {
  status?: ToolLifecycleStatus
  shouldStop?: boolean
  retryable?: boolean
  nextAction?: string | null
}

export function toErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) {
    return error.message
  }
  return "Unknown error"
}

/** Natural-language outcome for the model; keep `ok` for structured checks. */
export function toolOk<T extends Record<string, unknown> = Record<string, never>>(
  message: string,
  data: T = {} as T,
  meta: ToolOutcomeMeta = {}
) {
  return {
    ok: true as const,
    message,
    ...data,
    status: meta.status ?? "completed",
    shouldStop: meta.shouldStop ?? false,
    retryable: meta.retryable ?? false,
    nextAction: meta.nextAction ?? null,
  }
}

export function toolErr<T extends Record<string, unknown> = Record<string, never>>(
  error: string,
  data: T = {} as T,
  meta: ToolOutcomeMeta = {}
) {
  return {
    ok: false as const,
    message: `Failed: ${error}`,
    error,
    ...data,
    status: meta.status ?? "blocked",
    shouldStop: meta.shouldStop ?? true,
    retryable: meta.retryable ?? false,
    nextAction: meta.nextAction ?? "reply_to_user",
  }
}

export function toolRetryLater<T extends Record<string, unknown> = Record<string, never>>(
  message: string,
  data: T = {} as T,
  meta: Omit<ToolOutcomeMeta, "status" | "retryable"> = {}
) {
  return {
    ok: false as const,
    message: `Retry later: ${message}`,
    error: message,
    ...data,
    status: "retry_later" as const,
    shouldStop: meta.shouldStop ?? true,
    retryable: true as const,
    nextAction: meta.nextAction ?? "wait_and_retry",
  }
}

export const OPEN_APP_PARAMS: ToolParameter[] = [
  {
    name: "appId",
    type: "string",
    description:
      "App id to open: finder|canvas|logo|vibecoding|textedit|report, or a third-party id tp_<slug> (e.g. tp_weather_widget). To open a specific text file, use open_text_file.",
    required: true,
  },
]

export const OPEN_TEXT_FILE_PARAMS: ToolParameter[] = [
  { name: "id", type: "string", description: "Text file id to open", required: false },
  { name: "name", type: "string", description: "Text file name to open (case-insensitive)", required: false },
]

export const OPEN_CANVAS_PROJECT_PARAMS: ToolParameter[] = [
  { name: "projectId", type: "string", description: "Canvas project id to open (preferred when known).", required: false },
  {
    name: "projectName",
    type: "string",
    description: "Canvas project title to resolve and open when id is unknown.",
    required: false,
  },
]

export const ADD_SVG_TO_CANVAS_PARAMS: ToolParameter[] = [
  {
    name: "prompt",
    type: "string",
    description: "Describe what SVG should be generated, for example: 'A blue rounded badge with text HI'.",
    required: true,
  },
  { name: "scale", type: "number", description: "Optional scale multiplier between 0.1 and 4. Default is 1.", required: false },
  { name: "width", type: "number", description: "Optional generated SVG width (120-2400).", required: false },
  { name: "height", type: "number", description: "Optional generated SVG height (120-2400).", required: false },
]

export const RENDER_ARTIFACT_PARAMS: ToolParameter[] = [
  {
    name: "html",
    type: "string",
    description:
      "The complete HTML document string to display. This should be the final message-html-builder style artifact, not a prompt for image generation. Pass the actual HTML markup.",
    required: true,
  },
  {
    name: "title",
    type: "string",
    description: "Optional title shown above the artifact.",
    required: false,
  },
]

export const CREATE_ITEM_PARAMS: ToolParameter[] = [
  { name: "name", type: "string", description: "Display name for the new item", required: true },
  { name: "itemType", type: "string", description: "folder|text|image|code|spreadsheet|generic", required: false },
  { name: "parentId", type: "string", description: "Optional parent folder id", required: false },
]

export const RENAME_ITEM_PARAMS: ToolParameter[] = [
  { name: "id", type: "string", description: "Item id", required: true },
  { name: "name", type: "string", description: "New name", required: true },
]

export const DELETE_ITEM_PARAMS: ToolParameter[] = [
  { name: "id", type: "string", description: "Item id", required: true },
]

export const MOVE_DESKTOP_ITEM_PARAMS: ToolParameter[] = [
  { name: "itemId", type: "string", description: "Desktop item id to move", required: true },
  {
    name: "targetFolderId",
    type: "string",
    description: "Target folder id. If omitted, item will be moved to desktop.",
    required: false,
  },
  {
    name: "x",
    type: "number",
    description: "Optional desktop X position. Must be used together with y when moving to desktop.",
    required: false,
  },
  {
    name: "y",
    type: "number",
    description: "Optional desktop Y position. Must be used together with x when moving to desktop.",
    required: false,
  },
]

export const READ_TEXT_FILE_CONTENT_PARAMS: ToolParameter[] = [
  { name: "fileId", type: "string", description: "Text file id to read", required: true },
]

export const WRITE_TEXT_FILE_CONTENT_PARAMS: ToolParameter[] = [
  { name: "fileId", type: "string", description: "Text file id to write", required: true },
  { name: "content", type: "string", description: "The full text content to write into editor", required: true },
]

export const TRIGGER_BUILD_PARAMS: ToolParameter[] = [
  { name: "prompt", type: "string", description: "Natural language build request.", required: true },
  { name: "projectId", type: "string", description: "Optional project id for scoped build context.", required: false },
]

export const TRIGGER_CODING_WORKFLOW_PARAMS: ToolParameter[] = [
  {
    name: "report",
    type: "object",
    description:
      "Structured coding report with keys: goal, currentState, clarifications, implementationPlan, constraints, acceptanceCriteria, sandboxTask.",
    required: true,
  },
  {
    name: "appId",
    type: "string",
    description: "Optional coding app id. If omitted, the currently active coding app is used.",
    required: false,
  },
]

export const OPEN_CODING_SIDEBAR_PARAMS: ToolParameter[] = [
  {
    name: "reason",
    type: "string",
    description: "Optional reason for opening the coding sidebar.",
    required: false,
  },
]

export const SET_CODING_PROJECT_STATUS_PARAMS: ToolParameter[] = [
  {
    name: "status",
    type: "string",
    description:
      "One of: reviewing_request, needs_clarification, ready_for_confirmation.",
    required: true,
  },
  {
    name: "summary",
    type: "string",
    description: "Optional short summary shown in the Vibecoding workspace.",
    required: false,
  },
  {
    name: "appId",
    type: "string",
    description: "Optional coding app id. If omitted, the currently active coding app is used.",
    required: false,
  },
]

export const CREATE_CODING_APP_PARAMS: ToolParameter[] = [
  {
    name: "name",
    type: "string",
    description: "Name for the new coding app workspace.",
    required: true,
  },
  {
    name: "description",
    type: "string",
    description: "Optional short description for what this coding app is for.",
    required: false,
  },
]

export const ACTIVATE_CODING_APP_PARAMS: ToolParameter[] = [
  {
    name: "appId",
    type: "string",
    description: "Coding app id to activate in the sidebar.",
    required: false,
  },
  {
    name: "name",
    type: "string",
    description: "Coding app name to activate when appId is unknown.",
    required: false,
  },
]

export const CONFIRM_LOGO_BRIEF_PARAMS: ToolParameter[] = [
  { name: "fullPrompt", type: "string", description: "Final prompt for logo design workflow.", required: true },
  {
    name: "brandBrief",
    type: "object",
    description: "Structured brand brief object collected from conversation.",
    required: false,
  },
]

export const OPEN_LOGO_SIDEBAR_PARAMS: ToolParameter[] = [
  {
    name: "reason",
    type: "string",
    description: "Optional reason shown in tool result for why clarification is needed.",
    required: false,
  },
]

export const OPEN_CANVAS_SIDEBAR_PARAMS: ToolParameter[] = [
  {
    name: "reason",
    type: "string",
    description: "Optional reason shown in tool result for why the Canvas copilot was opened.",
    required: false,
  },
]

export const HANDOFF_TO_AGENT_PARAMS: ToolParameter[] = [
  {
    name: "targetAgentId",
    type: "string",
    description:
      "Agent id to switch to: main_agent, canvas_agent, logo_agent, coding_agent, or third_party_agent (embedded iframe apps).",
    required: true,
  },
  {
    name: "reason",
    type: "string",
    description: "Optional short reason for handoff.",
    required: false,
  },
  {
    name: "maxTokens",
    type: "number",
    description: "Optional digest budget for backend summarization. Defaults to 400.",
    required: false,
  },
  {
    name: "task",
    type: "string",
    description: "Optional explicit task statement to carry into handoff report.",
    required: false,
  },
  { name: "done", type: "string[]", description: "Optional completed work bullets.", required: false },
  { name: "nextSteps", type: "string[]", description: "Optional immediate next-step bullets.", required: false },
  { name: "constraints", type: "string[]", description: "Optional constraints or requirements.", required: false },
  { name: "artifacts", type: "string[]", description: "Optional files/ids/outputs produced so far.", required: false },
  { name: "openQuestions", type: "string[]", description: "Optional unresolved questions.", required: false },
  { name: "riskNotes", type: "string[]", description: "Optional known risks or caveats.", required: false },
  {
    name: "report",
    type: "object",
    description: "Optional report patch. Backend auto-generates summary first, then merges this patch.",
    required: false,
  },
]

export const START_NEW_CHAT_THREAD_PARAMS: ToolParameter[] = [
  {
    name: "reason",
    type: "string",
    description: "Optional reason for isolating the next task into a new chat thread.",
    required: false,
  },
]
