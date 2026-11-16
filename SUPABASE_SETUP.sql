-- ============================================
-- SUPABASE SETUP: Image ID Migration
-- ============================================
-- Run each section in your Supabase SQL Editor
-- Do NOT run the entire file at once - go section by section

-- ============================================
-- SECTION 1: Add image_id columns
-- ============================================
ALTER TABLE posts ADD COLUMN image_id text;
ALTER TABLE gallery_photos ADD COLUMN image_id text;

-- ============================================
-- SECTION 2: Optional - Migrate old data
-- ============================================
-- If you have existing posts/photos, you'll need to manually
-- map old URLs to new image IDs. For now, leave this blank.
-- New posts will use image_id directly.

-- ============================================
-- SECTION 3: Make image_id NOT NULL (after all rows have values)
-- ============================================
-- Only run this after you've populated image_id for all rows
-- ALTER TABLE posts ALTER COLUMN image_id SET NOT NULL;
-- ALTER TABLE gallery_photos ALTER COLUMN image_id SET NOT NULL;

-- ============================================
-- SECTION 4: Drop old image columns (OPTIONAL - only after verified)
-- ============================================
-- WARNING: Only run this AFTER you're certain all data is migrated
-- ALTER TABLE posts DROP COLUMN image_url;
-- ALTER TABLE posts DROP COLUMN image_urls;
-- ALTER TABLE gallery_photos DROP COLUMN image_url;
-- ALTER TABLE gallery_photos DROP COLUMN caption;
