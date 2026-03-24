CREATE TABLE "handoff_context" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" text NOT NULL,
  "thread_id" text NOT NULL,
  "source_agent_id" text NOT NULL,
  "target_agent_id" text NOT NULL,
  "content" text NOT NULL,
  "status" text DEFAULT 'pending' NOT NULL,
  "metadata" jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "consumed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX "handoff_context_thread_target_status_idx" ON "handoff_context" USING btree ("thread_id","target_agent_id","status");
--> statement-breakpoint
CREATE INDEX "handoff_context_user_thread_idx" ON "handoff_context" USING btree ("user_id","thread_id");
