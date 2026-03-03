import { init } from "@mastra/inngest"
import { inngest } from "@/server/mastra/inngest/client"
import { brandDesignStep } from "@/server/mastra/inngest/functions/logo-design/brand-design.function"
import { notifyStep } from "@/server/mastra/inngest/functions/logo-design/notify.function"
import { planLogoStep } from "@/server/mastra/inngest/functions/logo-design/plan.function"
import { philosophyStep } from "@/server/mastra/inngest/functions/logo-design/philosophy.function"
import { posterDesignStep } from "@/server/mastra/inngest/functions/logo-design/poster-design.function"
import {
  logoDesignFinalOutputSchema,
  logoDesignWorkflowInputSchema,
} from "@/server/mastra/inngest/functions/logo-design/schemas"

const { createWorkflow } = init(inngest)

export const LOGO_DESIGN_WORKFLOW_ID = "logo-design"

export const logoDesignWorkflow = createWorkflow({
  id: LOGO_DESIGN_WORKFLOW_ID,
  description:
    "Multi-agent logo design: brief -> concepts -> philosophy -> poster -> notify",
  inputSchema: logoDesignWorkflowInputSchema,
  outputSchema: logoDesignFinalOutputSchema,
  concurrency: {
    limit: 2,
    key: "event.data.userId",
  },
})
  .then(planLogoStep)
  .then(brandDesignStep)
  .then(philosophyStep)
  .then(posterDesignStep)
  .then(notifyStep)
  .commit()
