import { execFile } from "node:child_process"
import { promises as fs } from "node:fs"
import { basename, resolve, sep } from "node:path"
import { promisify } from "node:util"

import { createTool } from "@mastra/core/tools"
import { z } from "zod"

import { requestContextSchema } from "./common"

const execFileAsync = promisify(execFile)
const REPO_ROOT = process.cwd()
const MAX_LIST_RESULTS = 200
const MAX_SEARCH_RESULTS = 60
const MAX_READ_LINES = 400
const RG_IGNORE_GLOBS = [
  "!node_modules",
  "!.git",
  "!.next",
  "!fronted/.next",
  "!dist",
  "!build",
]

type ExecFileError = Error & {
  code?: number | string
  stdout?: string
  stderr?: string
}

function normalizeRelativePath(input: string) {
  const trimmed = input.trim()
  if (!trimmed) {
    throw new Error("path is required")
  }

  const absolutePath = resolve(REPO_ROOT, trimmed)
  if (absolutePath !== REPO_ROOT && !absolutePath.startsWith(`${REPO_ROOT}${sep}`)) {
    throw new Error(`Path escapes project root: ${input}`)
  }

  return {
    absolutePath,
    relativePath:
      absolutePath === REPO_ROOT ? "." : absolutePath.slice(REPO_ROOT.length + 1),
  }
}

async function runRg(args: string[]) {
  try {
    const result = await execFileAsync("rg", args, {
      cwd: REPO_ROOT,
      maxBuffer: 4 * 1024 * 1024,
    })
    return result.stdout
  } catch (error) {
    const failure = error as ExecFileError
    if (failure.code === 1) {
      return ""
    }
    throw failure
  }
}

function toNumberedContent(content: string, startLine: number, endLine: number) {
  const lines = content.split("\n")
  const boundedEndLine = Math.min(endLine, startLine + MAX_READ_LINES - 1, lines.length)

  return {
    totalLines: lines.length,
    startLine,
    endLine: boundedEndLine,
    content: lines
      .slice(startLine - 1, boundedEndLine)
      .map((line, index) => `${startLine + index}: ${line}`)
      .join("\n"),
  }
}

export const listProjectFilesTool = createTool({
  id: "list_project_files",
  description:
    "List project files from the current repository root. Use before reading files when you need to discover paths.",
  requestContextSchema,
  inputSchema: z.object({
    path: z.string().trim().optional(),
    limit: z.number().int().positive().max(MAX_LIST_RESULTS).optional(),
  }),
  execute: async ({ path, limit }) => {
    const basePath = path?.trim() ? normalizeRelativePath(path).relativePath : "."
    const stdout = await runRg([
      "--files",
      "--hidden",
      ...RG_IGNORE_GLOBS.flatMap((glob) => ["--glob", glob]),
      basePath,
    ])

    const files = stdout
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => Boolean(line))
      .slice(0, limit ?? 80)

    return {
      ok: true,
      basePath,
      count: files.length,
      files,
    }
  },
})

export const searchProjectCodeTool = createTool({
  id: "search_project_code",
  description:
    "Search repository code or text by keyword or regex. Returns matching file paths with line snippets.",
  requestContextSchema,
  inputSchema: z.object({
    query: z.string().trim().min(1),
    path: z.string().trim().optional(),
    limit: z.number().int().positive().max(MAX_SEARCH_RESULTS).optional(),
  }),
  execute: async ({ query, path, limit }) => {
    const basePath = path?.trim() ? normalizeRelativePath(path).relativePath : "."
    const stdout = await runRg([
      "--line-number",
      "--column",
      "--no-heading",
      "--hidden",
      ...RG_IGNORE_GLOBS.flatMap((glob) => ["--glob", glob]),
      query,
      basePath,
    ])

    const matches = stdout
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => Boolean(line))
      .slice(0, limit ?? 20)
      .map((line) => {
        const [filePath, lineNumber, columnNumber, ...snippetParts] = line.split(":")
        return {
          path: filePath,
          line: Number(lineNumber),
          column: Number(columnNumber),
          snippet: snippetParts.join(":").trim(),
        }
      })

    return {
      ok: true,
      query,
      basePath,
      count: matches.length,
      matches,
    }
  },
})

export const readProjectFileTool = createTool({
  id: "read_project_file",
  description:
    "Read a repository file by relative path with optional line bounds. Content is returned with line numbers.",
  requestContextSchema,
  inputSchema: z.object({
    path: z.string().trim().min(1),
    startLine: z.number().int().positive().optional(),
    endLine: z.number().int().positive().optional(),
  }),
  execute: async ({ path, startLine, endLine }) => {
    const { absolutePath, relativePath } = normalizeRelativePath(path)
    const content = await fs.readFile(absolutePath, "utf-8")
    const safeStartLine = startLine ?? 1
    const safeEndLine = endLine ?? safeStartLine + 199

    if (safeEndLine < safeStartLine) {
      return {
        ok: false,
        error: "endLine must be greater than or equal to startLine",
      }
    }

    const numbered = toNumberedContent(content, safeStartLine, safeEndLine)

    return {
      ok: true,
      path: relativePath,
      fileName: basename(relativePath),
      totalLines: numbered.totalLines,
      startLine: numbered.startLine,
      endLine: numbered.endLine,
      content: numbered.content,
    }
  },
})
