import { createTool } from "@mastra/core/tools"
import { z } from "zod"
import { requestContextSchema } from "../common"

const DEFAULT_TIMEOUT_MS = 120_000
const MAX_TIMEOUT_MS = 300_000

const COMMAND_WHITELIST = new Set([
  "pnpm",
  "npm",
  "node",
  "bun",
  "npx",
  "tsc",
  "eslint",
  "vitest",
  "jest",
  "pytest",
  "python3",
  "git",
  "ls",
  "cat",
  "rg",
])

function safeTail(value: string, maxChars: number) {
  if (value.length <= maxChars) return value
  return value.slice(value.length - maxChars)
}

function parseCommand(command: string) {
  const trimmed = command.trim()
  if (!trimmed) return null

  if (/[;&|><`$]/.test(trimmed)) {
    return {
      ok: false as const,
      error: "Command contains blocked shell operators",
    }
  }

  const [binary] = trimmed.split(/\s+/)
  if (!binary || !COMMAND_WHITELIST.has(binary)) {
    return {
      ok: false as const,
      error: `Command "${binary ?? ""}" is not in the whitelist`,
    }
  }

  return {
    ok: true as const,
    binary,
  }
}

export const executeSandboxCommandTool = createTool({
  id: "execute_sandbox_command",
  description: "Execute a safe, whitelisted command inside the configured agent workspace sandbox.",
  requestContextSchema,
  inputSchema: z.object({
    command: z.string().trim().min(1),
    cwd: z.string().optional(),
    timeoutMs: z.number().int().positive().max(MAX_TIMEOUT_MS).optional(),
    tailChars: z.number().int().min(256).max(20_000).optional(),
  }),
  execute: async ({ command, cwd, timeoutMs, tailChars }, context) => {
    const userId = context.requestContext?.get("userId") as string | undefined
    if (!userId) {
      return { ok: false, error: "Missing authenticated user context" }
    }

    const parsed = parseCommand(command)
    if (!parsed?.ok) {
      return parsed ?? { ok: false, error: "Invalid command" }
    }

    if (!context.workspace?.sandbox?.executeCommand) {
      return {
        ok: false,
        error: "Workspace sandbox is not available for command execution",
      }
    }

    const startedAt = Date.now()
    const result = await context.workspace.sandbox.executeCommand(command, [], {
      cwd,
      timeout: Math.min(timeoutMs ?? DEFAULT_TIMEOUT_MS, MAX_TIMEOUT_MS),
    })
    const endedAt = Date.now()

    return {
      ok: true,
      command,
      success: result.success,
      exitCode: result.exitCode,
      stdout: safeTail(result.stdout, tailChars ?? 8000),
      stderr: safeTail(result.stderr, tailChars ?? 8000),
      executionTimeMs: result.executionTimeMs,
      startedAt,
      endedAt,
    }
  },
})

