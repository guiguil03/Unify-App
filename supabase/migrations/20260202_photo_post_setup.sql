-- ============================================================================
-- Setup for photo_post Storage Bucket
-- ============================================================================
-- IMPORTANT: This script requires admin permissions.
-- If you get permission errors, use the Supabase Dashboard instead (see SETUP_PHOTO_POST.md)
-- ============================================================================

-- Step 1: Create the bucket (if it doesn't exist)
-- This part should work without admin permissions
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'photo_post',
  'photo_post',
  true, -- Public bucket (images de posts accessibles publiquement)
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE
SET 
  name = EXCLUDED.name,
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ============================================================================
-- The following steps require ADMIN permissions.
-- If you get "must be owner" errors, create the policies via Supabase Dashboard:
-- Storage > Policies > New Policy
-- See SETUP_PHOTO_POST.md for detailed instructions
-- ============================================================================

-- Step 2: Enable RLS on storage.objects (requires admin)
-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Step 3: Drop existing policies (requires admin)
-- DROP POLICY IF EXISTS "Users can upload their own post images" ON storage.objects;
-- DROP POLICY IF EXISTS "Anyone can read post images" ON storage.objects;
-- DROP POLICY IF EXISTS "Users can delete their own post images" ON storage.objects;
-- DROP POLICY IF EXISTS "Users can update their own post images" ON storage.objects;

-- Step 4: Create policies (requires admin)
-- Uncomment these if you have admin access:

/*
-- Policy 1: Allow authenticated users to upload files in their own folder
CREATE POLICY "Users can upload their own post images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'photo_post' AND
  (name ~ ('^' || auth.uid()::text || '/'))
);

-- Policy 2: Allow anyone to read post images (public bucket)
CREATE POLICY "Anyone can read post images"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'photo_post'
);

-- Policy 3: Allow authenticated users to update files in their own folder
CREATE POLICY "Users can update their own post images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'photo_post' AND
  (name ~ ('^' || auth.uid()::text || '/'))
)
WITH CHECK (
  bucket_id = 'photo_post' AND
  (name ~ ('^' || auth.uid()::text || '/'))
);

-- Policy 4: Allow authenticated users to delete files in their own folder
CREATE POLICY "Users can delete their own post images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'photo_post' AND
  (name ~ ('^' || auth.uid()::text || '/'))
);
*/

-- ============================================================================
-- Verification queries (no admin needed)
-- ============================================================================
-- SELECT * FROM storage.buckets WHERE id = 'photo_post';

