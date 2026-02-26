import { desktopAgent } from "./desktop-agent"
import { DESKTOP_COPILOT_AGENT } from "@/shared/copilot/constants"

export const agents = {
  [DESKTOP_COPILOT_AGENT]: desktopAgent,
}
