-- Normalize legacy variant assets to single-logo asset types
DELETE FROM "logo_design_assets" AS src
USING "logo_design_assets" AS dst
WHERE src.run_id = dst.run_id
  AND (
    (src.asset_type = 'logo_svg_1' AND dst.asset_type = 'logo_svg_full') OR
    (src.asset_type = 'logo_png_1' AND dst.asset_type = 'logo_png') OR
    (src.asset_type = 'poster_svg_1' AND dst.asset_type = 'poster_svg') OR
    (src.asset_type = 'poster_png_1' AND dst.asset_type = 'poster_png')
  );--> statement-breakpoint

UPDATE "logo_design_assets"
SET
  asset_type = 'logo_svg_full',
  metadata = metadata || '{"migrated": true, "migrationSource": "logo_svg_1"}'::jsonb
WHERE asset_type = 'logo_svg_1';--> statement-breakpoint

UPDATE "logo_design_assets"
SET
  asset_type = 'logo_png',
  metadata = metadata || '{"migrated": true, "migrationSource": "logo_png_1"}'::jsonb
WHERE asset_type = 'logo_png_1';--> statement-breakpoint

UPDATE "logo_design_assets"
SET
  asset_type = 'poster_svg',
  metadata = metadata || '{"migrated": true, "migrationSource": "poster_svg_1"}'::jsonb
WHERE asset_type = 'poster_svg_1';--> statement-breakpoint

UPDATE "logo_design_assets"
SET
  asset_type = 'poster_png',
  metadata = metadata || '{"migrated": true, "migrationSource": "poster_png_1"}'::jsonb
WHERE asset_type = 'poster_png_1';--> statement-breakpoint

-- Remove remaining deprecated variant assets
DELETE FROM "logo_design_assets"
WHERE asset_type IN (
  'logo_svg_2',
  'logo_svg_3',
  'logo_png_2',
  'logo_png_3',
  'poster_svg_2',
  'poster_svg_3',
  'poster_png_2',
  'poster_png_3'
);--> statement-breakpoint

-- Backfill missing logo_svg_icon from result_json (fallback: full SVG, then placeholder)
INSERT INTO "logo_design_assets" (
  run_id,
  user_id,
  asset_type,
  content_text,
  mime_type,
  metadata
)
SELECT
  wr.id,
  wr.user_id,
  'logo_svg_icon',
  COALESCE(
    NULLIF(wr.result_json #>> '{brand,logoSvg,icon}', ''),
    NULLIF(wr.result_json #>> '{brand,variants,0,logoSvg,icon}', ''),
    NULLIF(wr.result_json #>> '{brand,logoVariants,0,logoSvg,icon}', ''),
    NULLIF(wr.result_json #>> '{brand,concepts,0,logoSvg,icon}', ''),
    NULLIF(wr.result_json #>> '{brand,logoSvg,full}', ''),
    NULLIF(wr.result_json #>> '{brand,variants,0,logoSvg,full}', ''),
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><rect width="256" height="256" fill="#111111"/></svg>'
  ),
  'image/svg+xml',
  jsonb_build_object('migrated', true, 'migrationSource', 'result_json') ||
  CASE
    WHEN COALESCE(
      NULLIF(wr.result_json #>> '{brand,logoSvg,icon}', ''),
      NULLIF(wr.result_json #>> '{brand,variants,0,logoSvg,icon}', ''),
      NULLIF(wr.result_json #>> '{brand,logoVariants,0,logoSvg,icon}', ''),
      NULLIF(wr.result_json #>> '{brand,concepts,0,logoSvg,icon}', ''),
      NULLIF(wr.result_json #>> '{brand,logoSvg,full}', ''),
      NULLIF(wr.result_json #>> '{brand,variants,0,logoSvg,full}', '')
    ) IS NULL
      THEN jsonb_build_object('migrationWarning', 'placeholder_used')
      ELSE '{}'::jsonb
  END
FROM "workflow_runs" AS wr
LEFT JOIN "logo_design_assets" AS existing
  ON existing.run_id = wr.id
  AND existing.asset_type = 'logo_svg_icon'
WHERE wr.workflow_type = 'logo-design'
  AND existing.id IS NULL;--> statement-breakpoint

-- Backfill missing logo_svg_wordmark from result_json (fallback: full SVG, then placeholder)
INSERT INTO "logo_design_assets" (
  run_id,
  user_id,
  asset_type,
  content_text,
  mime_type,
  metadata
)
SELECT
  wr.id,
  wr.user_id,
  'logo_svg_wordmark',
  COALESCE(
    NULLIF(wr.result_json #>> '{brand,logoSvg,wordmark}', ''),
    NULLIF(wr.result_json #>> '{brand,variants,0,logoSvg,wordmark}', ''),
    NULLIF(wr.result_json #>> '{brand,logoVariants,0,logoSvg,wordmark}', ''),
    NULLIF(wr.result_json #>> '{brand,concepts,0,logoSvg,wordmark}', ''),
    NULLIF(wr.result_json #>> '{brand,logoSvg,full}', ''),
    NULLIF(wr.result_json #>> '{brand,variants,0,logoSvg,full}', ''),
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 160"><rect width="640" height="160" fill="#111111"/></svg>'
  ),
  'image/svg+xml',
  jsonb_build_object('migrated', true, 'migrationSource', 'result_json') ||
  CASE
    WHEN COALESCE(
      NULLIF(wr.result_json #>> '{brand,logoSvg,wordmark}', ''),
      NULLIF(wr.result_json #>> '{brand,variants,0,logoSvg,wordmark}', ''),
      NULLIF(wr.result_json #>> '{brand,logoVariants,0,logoSvg,wordmark}', ''),
      NULLIF(wr.result_json #>> '{brand,concepts,0,logoSvg,wordmark}', ''),
      NULLIF(wr.result_json #>> '{brand,logoSvg,full}', ''),
      NULLIF(wr.result_json #>> '{brand,variants,0,logoSvg,full}', '')
    ) IS NULL
      THEN jsonb_build_object('migrationWarning', 'placeholder_used')
      ELSE '{}'::jsonb
  END
FROM "workflow_runs" AS wr
LEFT JOIN "logo_design_assets" AS existing
  ON existing.run_id = wr.id
  AND existing.asset_type = 'logo_svg_wordmark'
WHERE wr.workflow_type = 'logo-design'
  AND existing.id IS NULL;
