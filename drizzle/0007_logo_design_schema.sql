ALTER TABLE "workflow_runs" ADD COLUMN "workflow_type" text DEFAULT 'app-build' NOT NULL;--> statement-breakpoint
ALTER TABLE "workflow_runs" ADD COLUMN "brand_brief" jsonb;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "workflow_runs_workflow_type_idx" ON "workflow_runs" USING btree ("workflow_type");--> statement-breakpoint
CREATE TABLE "logo_design_assets" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "run_id" uuid NOT NULL,
  "user_id" text NOT NULL,
  "asset_type" text NOT NULL,
  "content_text" text,
  "storage_key" text,
  "mime_type" text,
  "size_bytes" integer,
  "width" integer,
  "height" integer,
  "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "logo_design_assets" ADD CONSTRAINT "logo_design_assets_run_id_workflow_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."workflow_runs"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "logo_design_assets_run_idx" ON "logo_design_assets" USING btree ("run_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "logo_design_assets_user_created_idx" ON "logo_design_assets" USING btree ("user_id", "created_at");
