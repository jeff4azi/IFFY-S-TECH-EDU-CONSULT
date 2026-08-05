-- ============================================
-- 0002_rename_social_links.sql
-- Rename social_links keys:
--   twitter  → whatsappChannel
--   linkedin → tiktok
-- ============================================

-- Migrate every existing row's social_links JSONB:
-- 1. Add the new keys from the old keys (default to '#' if missing)
-- 2. Remove the old keys
UPDATE site_settings
SET social_links = (
  social_links
  || jsonb_build_object(
      'whatsappChannel', COALESCE(social_links->>'twitter',  '#'),
      'tiktok',          COALESCE(social_links->>'linkedin', '#')
    )
) - 'twitter' - 'linkedin';
