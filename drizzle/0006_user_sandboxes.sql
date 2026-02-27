CREATE TABLE "user_sandboxes" (
  "user_id" text PRIMARY KEY NOT NULL,
  "sandbox_id" text NOT NULL,
  "provider" text DEFAULT 'e2b' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "last_used_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "user_sandboxes_sandbox_id_unique_idx" ON "user_sandboxes" USING btree ("sandbox_id");
