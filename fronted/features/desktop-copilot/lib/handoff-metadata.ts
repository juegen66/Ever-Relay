"use client"

import { type HandoffMetadata } from "@/shared/copilot/handoff"

export function formatHandoffMetadata(metadata: HandoffMetadata) {
  return [
    "[HANDOFF_METADATA_V1]",
    JSON.stringify(metadata, null, 2),
    "[/HANDOFF_METADATA_V1]",
    "Use this metadata as the primary context for continuation.",
  ].join("\n")
}
