CREATE TABLE "canvas_projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"visibility" text DEFAULT 'private' NOT NULL,
	"canvas_width" integer DEFAULT 1200 NOT NULL,
	"canvas_height" integer DEFAULT 800 NOT NULL,
	"thumbnail_url" text,
	"content_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"content_version" integer DEFAULT 1 NOT NULL,
	"last_opened_at" timestamp with time zone,
	"published_at" timestamp with time zone,
	"archived_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "canvas_tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"color" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "canvas_project_tags" (
	"project_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	CONSTRAINT "canvas_project_tags_pk" PRIMARY KEY("project_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "canvas_project_assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"asset_type" text NOT NULL,
	"storage_provider" text DEFAULT 'db' NOT NULL,
	"storage_key" text,
	"mime_type" text,
	"size_bytes" integer,
	"width" integer,
	"height" integer,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "canvas_project_activity_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"action" text NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "canvas_project_tags" ADD CONSTRAINT "canvas_project_tags_project_id_canvas_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."canvas_projects"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "canvas_project_tags" ADD CONSTRAINT "canvas_project_tags_tag_id_canvas_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."canvas_tags"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "canvas_project_assets" ADD CONSTRAINT "canvas_project_assets_project_id_canvas_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."canvas_projects"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "canvas_project_activity_logs" ADD CONSTRAINT "canvas_project_activity_logs_project_id_canvas_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."canvas_projects"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "canvas_projects_user_updated_idx" ON "canvas_projects" USING btree ("user_id","updated_at");
--> statement-breakpoint
CREATE INDEX "canvas_projects_user_status_updated_idx" ON "canvas_projects" USING btree ("user_id","status","updated_at");
--> statement-breakpoint
CREATE INDEX "canvas_projects_user_deleted_idx" ON "canvas_projects" USING btree ("user_id","deleted_at");
--> statement-breakpoint
CREATE UNIQUE INDEX "canvas_tags_user_name_unique_idx" ON "canvas_tags" USING btree ("user_id","name");
--> statement-breakpoint
CREATE INDEX "canvas_project_tags_tag_idx" ON "canvas_project_tags" USING btree ("tag_id");
--> statement-breakpoint
CREATE INDEX "canvas_project_assets_project_created_idx" ON "canvas_project_assets" USING btree ("project_id","created_at");
--> statement-breakpoint
CREATE INDEX "canvas_project_assets_user_created_idx" ON "canvas_project_assets" USING btree ("user_id","created_at");
--> statement-breakpoint
CREATE INDEX "canvas_project_activity_logs_project_created_idx" ON "canvas_project_activity_logs" USING btree ("project_id","created_at");
