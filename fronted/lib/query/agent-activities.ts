import { useQuery } from "@tanstack/react-query"

import { agentActivitiesApi, type AgentActivity } from "@/lib/api/modules/agent-activities"

export type { AgentActivity }

export const agentActivitiesQueryKeys = {
  all: ["agent-activities"] as const,
  list: ["agent-activities", "list"] as const,
}

function sortActivitiesByTimestampDesc(activities: AgentActivity[]) {
  return [...activities].sort((left, right) => {
    const leftTime = Date.parse(left.timestamp)
    const rightTime = Date.parse(right.timestamp)

    if (Number.isNaN(leftTime) && Number.isNaN(rightTime)) {
      return 0
    }
    if (Number.isNaN(leftTime)) {
      return 1
    }
    if (Number.isNaN(rightTime)) {
      return -1
    }

    return rightTime - leftTime
  })
}

export function useAgentActivitiesQuery() {
  return useQuery({
    queryKey: agentActivitiesQueryKeys.list,
    queryFn: async () =>
      sortActivitiesByTimestampDesc(await agentActivitiesApi.list({ limit: 50 })),
  })
}
