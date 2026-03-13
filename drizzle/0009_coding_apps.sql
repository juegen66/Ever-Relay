CREATE TABLE "coding_apps" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" text NOT NULL,
  "name" text NOT NULL,
  "description" text,
  "sandbox_id" text NOT NULL,
  "thread_id" text NOT NULL,
  "status" text DEFAULT 'active' NOT NULL,
  "last_opened_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "coding_apps_user_updated_idx" ON "coding_apps" USING btree ("user_id","updated_at");
--> statement-breakpoint
CREATE INDEX "coding_apps_user_status_idx" ON "coding_apps" USING btree ("user_id","status");
--> statement-breakpoint
CREATE UNIQUE INDEX "coding_apps_sandbox_id_unique_idx" ON "coding_apps" USING btree ("sandbox_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "coding_apps_thread_id_unique_idx" ON "coding_apps" USING btree ("thread_id");
