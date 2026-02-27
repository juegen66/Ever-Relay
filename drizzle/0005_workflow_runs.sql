CREATE TABLE "workflow_runs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" text NOT NULL,
  "project_id" text,
  "prompt" text NOT NULL,
  "stage" text DEFAULT 'queued' NOT NULL,
  "status" text DEFAULT 'queued' NOT NULL,
  "plan_json" jsonb,
  "result_json" jsonb,
  "error" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX "workflow_runs_user_status_idx" ON "workflow_runs" USING btree ("user_id", "status");
CREATE INDEX "workflow_runs_user_created_idx" ON "workflow_runs" USING btree ("user_id", "created_at");

