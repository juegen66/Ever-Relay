/**
 * Seed afs_skill table with the global preference-memory-maintainer skill.
 *
 * Run: USER_ID=your-user-id pnpm db:seed-preference-memory-maintainer
 *
 * Uses USER_ID env var (required for production). Falls back to
 * mastra-skill-test-user for local testing.
 */

import {
  PREFERENCE_MEMORY_MAINTAINER_SEED,
} from "@/server/afs/preference-skill"
import { afsSkillService } from "@/server/afs/skill"

async function main() {
  const userId =
    process.env.USER_ID ??
    process.env.MASTRA_SKILL_TEST_USER_ID ??
    "mastra-skill-test-user"

  console.log(`Seeding ${PREFERENCE_MEMORY_MAINTAINER_SEED.name} for userId=${userId}...`)

  await afsSkillService.upsertSkill(userId, {
    agentId: null,
    scope: "Desktop",
    name: PREFERENCE_MEMORY_MAINTAINER_SEED.name,
    description: PREFERENCE_MEMORY_MAINTAINER_SEED.description,
    triggerWhen: PREFERENCE_MEMORY_MAINTAINER_SEED.triggerWhen,
    tags: [...PREFERENCE_MEMORY_MAINTAINER_SEED.tags],
    content: PREFERENCE_MEMORY_MAINTAINER_SEED.content,
    priority: PREFERENCE_MEMORY_MAINTAINER_SEED.priority,
    metadata: {
      source: "seed-script",
      purpose: "preference-memory-maintainer",
      kind: "meta-skill",
    },
  })

  console.log("  ✓ preference-memory-maintainer (Desktop, global)")
  console.log("\nDone. Ask any AFS-skill-enabled copilot to record or reuse user preferences to verify.")
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
