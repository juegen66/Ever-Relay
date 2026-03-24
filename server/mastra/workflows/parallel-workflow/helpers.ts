import type {
  ParallelPlan,
  ParallelTask,
  ParallelTaskReport,
} from "@/server/mastra/workflows/parallel-workflow/types"

export function uniqStrings(values: string[]) {
  return [...new Set(values)]
}

export function getExecutableParallelTasks(
  plan: ParallelPlan,
  completedTaskIds: string[]
) {
  return plan.tasks.filter(
    (task) =>
      !completedTaskIds.includes(task.id) &&
      task.dependsOn.every((dependencyId) => completedTaskIds.includes(dependencyId))
  )
}

export function normalizeParallelTaskAgentId(
  task: ParallelTask,
  allowedTaskAgentIds: readonly string[],
  defaultTaskAgentId: string
) {
  const candidate = task.agentId.trim()
  if (!candidate) {
    return defaultTaskAgentId
  }

  return allowedTaskAgentIds.includes(candidate)
    ? candidate
    : defaultTaskAgentId
}

export function finalizeParallelTaskReport(
  task: ParallelTask,
  report: Partial<ParallelTaskReport> | undefined
): ParallelTaskReport {
  return {
    taskId: report?.taskId?.trim() || task.id,
    taskName: report?.taskName?.trim() || task.name,
    status:
      report?.status === "done" ||
      report?.status === "blocked" ||
      report?.status === "partial"
        ? report.status
        : "blocked",
    summary: report?.summary?.trim() || `Task ${task.id} returned an empty summary.`,
  }
}

export function buildParallelSynthesis(
  plan: ParallelPlan,
  completedTaskIds: string[],
  reports: ParallelTaskReport[]
) {
  const total = plan.tasks.length
  const doneCount = completedTaskIds.length
  const blocked = reports.filter((report) => report.status !== "done")

  if (doneCount >= total) {
    return `Completed ${total}/${total} tasks. ${reports.map((report) => `[${report.taskId}] ${report.summary}`).join(" ")}`
  }

  const parts = [`Completed ${doneCount}/${total} tasks.`]

  if (blocked.length > 0) {
    parts.push(
      `Non-complete tasks: ${blocked.map((report) => `[${report.taskId}] ${report.status}: ${report.summary}`).join(" ")}`
    )
  }

  return parts.join(" ")
}
