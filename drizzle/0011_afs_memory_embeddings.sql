-- AFS memory embeddings
-- Add external vector table for scoped semantic search over afs_memory

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS "afs_memory_embeddings" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "memory_id" uuid NOT NULL REFERENCES "afs_memory"("id") ON DELETE CASCADE,
  "user_id" text NOT NULL,
  "embedding" vector(1536) NOT NULL,
  "model" text NOT NULL,
  "model_version" text NOT NULL,
  "content_hash" text NOT NULL,
  "indexed_at" timestamp with time zone DEFAULT now() NOT NULL,
  "stale_at" timestamp with time zone,
  "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "afs_memory_embeddings_memory_id_idx"
  ON "afs_memory_embeddings" ("memory_id");

CREATE INDEX IF NOT EXISTS "afs_memory_embeddings_user_id_idx"
  ON "afs_memory_embeddings" ("user_id");

CREATE INDEX IF NOT EXISTS "afs_memory_embeddings_stale_idx"
  ON "afs_memory_embeddings" ("stale_at");
