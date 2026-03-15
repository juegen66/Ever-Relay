import { init } from "@mastra/inngest"

import { inngest } from "@/server/mastra/inngest/client"
import { brandDesignStep } from "@/server/mastra/inngest/functions/logo-design/brand-design.function"
import { distillMemoryStep } from "@/server/mastra/inngest/functions/memory/distill.function"
import { notifyStep } from "@/server/mastra/inngest/functions/logo-design/notify.function"
import { philosophyStep } from "@/server/mastra/inngest/functions/logo-design/philosophy.function"
import { planLogoStep } from "@/server/mastra/inngest/functions/logo-design/plan.function"
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
    "Canvas-first multi-agent logo design: context+philosophy -> concepts -> persist philosophy -> poster -> notify -> distill memory",
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
  .then(distillMemoryStep)
  .commit()
