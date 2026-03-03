import { createStep } from "@mastra/inngest"
import { inngest } from "@/server/mastra/inngest/client"
import { LOGO_DESIGN_COMPLETED_EVENT } from "@/server/mastra/inngest/events"
import { logoDesignFinalOutputSchema } from "./schemas"

export const notifyStep = createStep({
  id: "logo_notify",
  description: "Send logo design completed event",
  inputSchema: logoDesignFinalOutputSchema,
  outputSchema: logoDesignFinalOutputSchema,
  execute: async ({ inputData }) => {
    await inngest.send({
      name: LOGO_DESIGN_COMPLETED_EVENT,
      data: {
        runId: inputData.runId,
        userId: inputData.userId,
        summary: "Logo design completed",
      },
    })

    return inputData
  },
})
