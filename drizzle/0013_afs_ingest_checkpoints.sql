CREATE TABLE IF NOT EXISTS "afs_ingest_checkpoints" (
  "user_id" text PRIMARY KEY NOT NULL,
  "last_ingested_at" timestamp with time zone,
  "last_history_created_at" timestamp with time zone,
  "last_history_id" uuid,
  "last_run_at" timestamp with time zone,
  "status" text DEFAULT 'idle' NOT NULL,
  "error" text,
  "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "afs_ingest_checkpoints_status_updated_idx"
  ON "afs_ingest_checkpoints" ("status", "updated_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "afs_ingest_checkpoints_last_run_idx"
  ON "afs_ingest_checkpoints" ("last_run_at");
