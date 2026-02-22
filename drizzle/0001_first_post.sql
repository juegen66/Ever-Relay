CREATE TABLE "desktop_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"item_type" text NOT NULL,
	"parent_id" uuid,
	"x" integer DEFAULT 100 NOT NULL,
	"y" integer DEFAULT 100 NOT NULL,
	"s3_key" text,
	"file_size" integer,
	"mime_type" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
