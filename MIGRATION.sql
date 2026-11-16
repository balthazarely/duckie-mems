-- Migration: Switch from image URLs to image IDs
-- Run this in Supabase SQL Editor

-- 1. Add image_id columns
ALTER TABLE posts ADD COLUMN image_id text;
ALTER TABLE gallery_photos ADD COLUMN image_id text;

-- 2. Optional: Migrate existing data (if you have old posts)
-- You'll need to manually map old URLs to new image IDs
-- UPDATE posts SET image_id = '...' WHERE id = '...';
-- UPDATE gallery_photos SET image_id = '...' WHERE id = '...';

-- 3. After verifying migration is complete, optionally drop old columns:
-- ALTER TABLE posts DROP COLUMN image_url;
-- ALTER TABLE posts DROP COLUMN image_urls;
-- ALTER TABLE gallery_photos DROP COLUMN image_url;

-- 4. Make image_id NOT NULL (after ensuring all rows have values):
-- ALTER TABLE posts ALTER COLUMN image_id SET NOT NULL;
-- ALTER TABLE gallery_photos ALTER COLUMN image_id SET NOT NULL;
