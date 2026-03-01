import { init } from "@mastra/inngest"
import { inngest } from "@/server/mastra/inngest/client"
import { brandDesignStep } from "@/server/mastra/inngest/functions/logo-design/brand-design.function"
import { notifyStep } from "@/server/mastra/inngest/functions/logo-design/notify.function"
import { persistStep } from "@/server/mastra/inngest/functions/logo-design/persist.function"
import { planLogoStep } from "@/server/mastra/inngest/functions/logo-design/plan.function"
import { posterDesignStep } from "@/server/mastra/inngest/functions/logo-design/poster-design.function"
import {
  logoDesignPersistOutputSchema,
  logoDesignWorkflowInputSchema,
} from "@/server/mastra/inngest/functions/logo-design/schemas"

const { createWorkflow } = init(inngest)

export const LOGO_DESIGN_WORKFLOW_ID = "logo-design"

export const logoDesignWorkflow = createWorkflow({
  id: LOGO_DESIGN_WORKFLOW_ID,
  description:
    "Multi-agent logo design: plan -> brand -> poster -> persist -> notify",
  inputSchema: logoDesignWorkflowInputSchema,
  outputSchema: logoDesignPersistOutputSchema,
  concurrency: {
    limit: 2,
    key: "event.data.userId",
  },
})
  .then(planLogoStep)
  .then(brandDesignStep)
  .then(posterDesignStep)
  .then(persistStep)
  .then(notifyStep)
  .commit()
