import type { ParallelTask } from "@/server/mastra/workflows/parallel-workflow/types"

export function buildParallelTaskPrompt(task: ParallelTask) {
  const locationText = task.location.trim() || "Not specified"
  const validationText = task.validation.trim() || "Not specified"
  const prerequisitesSection = task.prerequisites.trim()
    ? `## Prerequisites
${task.prerequisites}

`
    : ""

  return `## Parallel Workflow Context
- Task ID: ${task.id}
- Task Name: ${task.name}
- Location: ${locationText}
- Dependencies: ${task.dependsOn.join(", ") || "None"}

${prerequisitesSection}## Description
${task.description}

## Acceptance Criteria
${task.acceptanceCriteria.map((criterion) => `- ${criterion}`).join("\n")}

## Validation
${validationText}

## Execution Rules
- This task is part of an internal parallel workflow run.
- If relevant skills are listed, activate the matching skills before following them.
- Stay inside the assigned task scope; do not plan unrelated follow-up work.
- Return JSON only with: taskId, taskName, status, summary.
`
}
