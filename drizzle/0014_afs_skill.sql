-- AFS Skill: Dynamic skill storage for agents
-- Skills are loaded in two phases: metadata first, then full content on activation

CREATE TABLE IF NOT EXISTS "afs_skill" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" text NOT NULL,
  "agent_id" text,
  "scope" text DEFAULT 'Desktop' NOT NULL,
  "name" text NOT NULL,
  "description" text NOT NULL,
  "trigger_when" text,
  "tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "content" text NOT NULL,
  "version" integer DEFAULT 1 NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "priority" integer DEFAULT 0 NOT NULL,
  "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Same agent + user + name must be unique
CREATE UNIQUE INDEX IF NOT EXISTS "afs_skill_user_agent_name_idx"
  ON "afs_skill" ("user_id", "agent_id", "name");

-- Query active skills by scope
CREATE INDEX IF NOT EXISTS "afs_skill_user_scope_active_idx"
  ON "afs_skill" ("user_id", "scope", "is_active");

-- Query active skills by agent
CREATE INDEX IF NOT EXISTS "afs_skill_agent_active_idx"
  ON "afs_skill" ("agent_id", "is_active");
