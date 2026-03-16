import { readFileSync } from "node:fs"
import { join } from "node:path"

const FRONTMATTER_PATTERN = /^---[\s\S]*?---\n/

function stripFrontmatter(source: string) {
  return source.replace(FRONTMATTER_PATTERN, "").trim()
}

function sliceBlock(source: string, startMarker: string, endMarker?: string) {
  const startIndex = source.indexOf(startMarker)
  if (startIndex === -1) {
    return source
  }

  const endIndex = endMarker ? source.indexOf(endMarker, startIndex) : -1
  if (endIndex === -1) {
    return source.slice(startIndex).trim()
  }

  return source.slice(startIndex, endIndex).trim()
}

const canvasDesignSkillPath = join(process.cwd(), "skills/canvas-design/SKILL.md")

export const canvasDesignPrompt = stripFrontmatter(
  readFileSync(canvasDesignSkillPath, "utf-8")
)

export const canvasDesignPhilosophyBlock = sliceBlock(
  canvasDesignPrompt,
  "## DESIGN PHILOSOPHY CREATION",
  "---\n\n## DEDUCING THE SUBTLE REFERENCE"
)

export const canvasDesignReferenceBlock = sliceBlock(
  canvasDesignPrompt,
  "## DEDUCING THE SUBTLE REFERENCE",
  "---\n\n## CANVAS CREATION"
)

export const canvasDesignPolishBlock = sliceBlock(
  canvasDesignPrompt,
  "## FINAL STEP",
  "## MULTI-PAGE OPTION"
)

export const canvasDesignLogoFusionBlock = [
  canvasDesignReferenceBlock,
  canvasDesignPolishBlock,
]
  .filter(Boolean)
  .join("\n\n")
