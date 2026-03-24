-- AFS Skill Reference: reference documents loaded on demand for dynamic skills

DROP INDEX IF EXISTS "afs_skill_user_agent_name_idx";
DROP INDEX IF EXISTS "afs_skill_user_agent_scope_name_idx";
DROP INDEX IF EXISTS "afs_skill_user_scope_name_global_idx";

CREATE UNIQUE INDEX IF NOT EXISTS "afs_skill_user_agent_scope_name_idx"
  ON "afs_skill" ("user_id", "agent_id", "scope", "name")
  WHERE "agent_id" IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "afs_skill_user_scope_name_global_idx"
  ON "afs_skill" ("user_id", "scope", "name")
  WHERE "agent_id" IS NULL;

CREATE TABLE IF NOT EXISTS "afs_skill_reference" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "skill_id" uuid NOT NULL REFERENCES "afs_skill"("id") ON DELETE CASCADE,
  "user_id" text NOT NULL,
  "name" text NOT NULL,
  "title" text NOT NULL,
  "description" text NOT NULL,
  "content" text NOT NULL,
  "content_format" text DEFAULT 'markdown' NOT NULL,
  "load_when" text,
  "priority" integer DEFAULT 0 NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "afs_skill_reference_skill_name_idx"
  ON "afs_skill_reference" ("skill_id", "name");

CREATE INDEX IF NOT EXISTS "afs_skill_reference_user_skill_active_idx"
  ON "afs_skill_reference" ("user_id", "skill_id", "is_active", "priority");
