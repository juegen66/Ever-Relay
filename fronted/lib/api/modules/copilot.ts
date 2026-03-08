import { request } from "@/lib/api"
import type {
  PrepareHandoffBody,
  PrepareHandoffData,
} from "@/shared/contracts/copilot-handoff"

export type { PrepareHandoffBody, PrepareHandoffData }

export const copilotApi = {
  prepareHandoff(body: PrepareHandoffBody) {
    return request.post<PrepareHandoffData, PrepareHandoffBody>(
      "/copilot/handoff/prepare",
      body
    )
  },
}
