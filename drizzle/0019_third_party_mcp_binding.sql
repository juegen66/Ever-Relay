CREATE TABLE IF NOT EXISTS "third_party_mcp_binding" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" text NOT NULL,
  "app_slug" text NOT NULL,
  "server_url" text NOT NULL,
  "auth_type" text DEFAULT 'none' NOT NULL,
  "auth_token" text,
  "is_active" boolean DEFAULT true NOT NULL,
  "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "third_party_mcp_binding_auth_type_check"
    CHECK ("auth_type" IN ('none', 'bearer'))
);

CREATE UNIQUE INDEX IF NOT EXISTS "third_party_mcp_binding_user_app_slug_idx"
  ON "third_party_mcp_binding" ("user_id", "app_slug");

CREATE INDEX IF NOT EXISTS "third_party_mcp_binding_active_updated_idx"
  ON "third_party_mcp_binding" ("user_id", "is_active", "updated_at");
