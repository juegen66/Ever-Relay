#!/usr/bin/env node

import { promises as fs } from "node:fs"
import path from "node:path"

const collator = new Intl.Collator("en", { numeric: true, sensitivity: "base" })

function parseArgs(argv) {
  const options = {
    src: "article",
    out: path.join("article", "thesis-full.md"),
    includePlan: false,
    includeTodo: false,
  }

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (arg === "--src" && argv[i + 1]) {
      options.src = argv[++i]
      continue
    }
    if (arg === "--out" && argv[i + 1]) {
      options.out = argv[++i]
      continue
    }
    if (arg === "--include-plan") {
      options.includePlan = true
      continue
    }
    if (arg === "--include-todo") {
      options.includeTodo = true
      continue
    }
  }

  return options
}

function compareEntries(a, b) {
  if (a.isDirectory() && !b.isDirectory()) return -1
  if (!a.isDirectory() && b.isDirectory()) return 1
  if (!a.isDirectory() && !b.isDirectory()) {
    if (a.name === "README.md" && b.name !== "README.md") return -1
    if (a.name !== "README.md" && b.name === "README.md") return 1
  }
  return collator.compare(a.name, b.name)
}

async function collectMarkdownFiles(dir) {
  const result = []
  const entries = await fs.readdir(dir, { withFileTypes: true })
  entries.sort(compareEntries)

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      const nested = await collectMarkdownFiles(fullPath)
      result.push(...nested)
      continue
    }
    if (entry.isFile() && entry.name.endsWith(".md")) {
      result.push(fullPath)
    }
  }

  return result
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  const root = process.cwd()
  const srcDir = path.resolve(root, options.src)
  const outFile = path.resolve(root, options.out)
  const outDir = path.dirname(outFile)
  const outName = path.basename(outFile)

  const files = await collectMarkdownFiles(srcDir)
  const excludedByName = new Set([outName])
  if (!options.includePlan) excludedByName.add("plan.md")
  if (!options.includeTodo) excludedByName.add("todo.md")

  const included = files.filter((filePath) => {
    const fileName = path.basename(filePath)
    return !excludedByName.has(fileName)
  })

  const header = [
    "# 论文总稿（自动组装）",
    "",
    `> Source: \`${path.relative(root, srcDir)}\``,
    `> Files: ${included.length}`,
    "",
  ].join("\n")

  const chunks = [header]
  for (const filePath of included) {
    const rel = path.relative(srcDir, filePath).split(path.sep).join("/")
    const content = (await fs.readFile(filePath, "utf8")).replace(/^\uFEFF/, "").trimEnd()
    chunks.push(`<!-- BEGIN: ${rel} -->\n\n${content}\n\n<!-- END: ${rel} -->\n`)
  }

  await fs.mkdir(outDir, { recursive: true })
  await fs.writeFile(outFile, `${chunks.join("\n")}\n`, "utf8")

  console.log(`Assembled ${included.length} markdown files -> ${path.relative(root, outFile)}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})

