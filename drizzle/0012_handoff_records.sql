CREATE TABLE "handoff_records" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" text NOT NULL,
  "handoff_id" text NOT NULL,
  "source_agent_id" text NOT NULL,
  "target_agent_id" text NOT NULL,
  "thread_id" text NOT NULL,
  "reason" text,
  "report" jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "handoff_records_user_created_idx" ON "handoff_records" USING btree ("user_id","created_at");
--> statement-breakpoint
CREATE INDEX "handoff_records_thread_created_idx" ON "handoff_records" USING btree ("thread_id","created_at");
