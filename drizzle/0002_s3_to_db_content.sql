-- Migration: Replace s3_key with content column for database-only file storage
ALTER TABLE "desktop_items" ADD COLUMN "content" text;
--> statement-breakpoint
-- Migrate any existing s3_key data is not possible (content was in S3), so we just drop the column
ALTER TABLE "desktop_items" DROP COLUMN IF EXISTS "s3_key";
