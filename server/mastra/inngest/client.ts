import { Inngest } from "inngest"

export const inngest = new Inngest({
  id: "cloudos",
  baseUrl: process.env.INNGEST_DEV_URL ?? "http://localhost:8288",
  isDev: process.env.NODE_ENV !== "production",
  eventKey: process.env.INNGEST_EVENT_KEY,
})

