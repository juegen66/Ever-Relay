CREATE TABLE IF NOT EXISTS "third_party_app_config" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" text NOT NULL,
  "app_slug" text NOT NULL,
  "display_name" text NOT NULL,
  "website_url" text,
  "allowed_origins" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "third_party_app_config_user_app_slug_idx"
  ON "third_party_app_config" ("user_id", "app_slug");

CREATE INDEX IF NOT EXISTS "third_party_app_config_active_updated_idx"
  ON "third_party_app_config" ("user_id", "is_active", "updated_at");
