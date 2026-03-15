-- AFS v2: Unified path-based file system
-- Replace old module-based tables with two unified tables: afs_memory + afs_history

-- 1. Create new tables

CREATE TABLE IF NOT EXISTS "afs_memory" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" text NOT NULL,
  "scope" text DEFAULT 'Desktop' NOT NULL,
  "bucket" text DEFAULT 'user' NOT NULL,
  "path" text DEFAULT '/' NOT NULL,
  "name" text NOT NULL,
  "content" text NOT NULL,
  "content_type" text,
  "tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "confidence" integer DEFAULT 80 NOT NULL,
  "source_type" text DEFAULT 'prediction_agent' NOT NULL,
  "access_count" integer DEFAULT 0 NOT NULL,
  "last_accessed_at" timestamp with time zone,
  "expires_at" timestamp with time zone,
  "deleted_at" timestamp with time zone,
  "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "afs_history" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" text NOT NULL,
  "scope" text DEFAULT 'Desktop' NOT NULL,
  "bucket" text DEFAULT 'actions' NOT NULL,
  "path" text DEFAULT '/' NOT NULL,
  "name" text NOT NULL,
  "action_type" text,
  "content" text NOT NULL,
  "status" text,
  "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- 2. Indexes for afs_memory

CREATE UNIQUE INDEX IF NOT EXISTS "afs_memory_user_scope_bucket_path_name_idx"
  ON "afs_memory" ("user_id", "scope", "bucket", "path", "name");

CREATE INDEX IF NOT EXISTS "afs_memory_user_scope_bucket_idx"
  ON "afs_memory" ("user_id", "scope", "bucket");

CREATE INDEX IF NOT EXISTS "afs_memory_user_confidence_idx"
  ON "afs_memory" ("user_id", "confidence");

CREATE INDEX IF NOT EXISTS "afs_memory_deleted_idx"
  ON "afs_memory" ("deleted_at");

-- 3. Indexes for afs_history

CREATE INDEX IF NOT EXISTS "afs_history_user_scope_bucket_created_idx"
  ON "afs_history" ("user_id", "scope", "bucket", "created_at");

CREATE INDEX IF NOT EXISTS "afs_history_user_action_type_idx"
  ON "afs_history" ("user_id", "action_type");

-- 4. Drop old tables

DROP TABLE IF EXISTS "user_memory_entries" CASCADE;
DROP TABLE IF EXISTS "user_action_logs" CASCADE;
DROP TABLE IF EXISTS "user_sessions_afs" CASCADE;
DROP TABLE IF EXISTS "prediction_run_logs" CASCADE;
DROP TABLE IF EXISTS "user_profiles_afs" CASCADE;

-- 5. Recreate afs_transaction_logs without module_id

DROP TABLE IF EXISTS "afs_transaction_logs" CASCADE;

CREATE TABLE IF NOT EXISTS "afs_transaction_logs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "actor" text NOT NULL,
  "operation" text NOT NULL,
  "path" text NOT NULL,
  "detail" jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "afs_tx_logs_actor_created_idx"
  ON "afs_transaction_logs" ("actor", "created_at");

CREATE INDEX IF NOT EXISTS "afs_tx_logs_path_idx"
  ON "afs_transaction_logs" ("path");
