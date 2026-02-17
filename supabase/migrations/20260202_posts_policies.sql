-- ============================================================================
-- Storage Policies Setup for posts bucket
-- ============================================================================
-- This file should be run directly in Supabase SQL Editor (not via migrations)
-- It requires elevated permissions to create policies on storage.objects
-- ============================================================================

-- Enable RLS on storage.objects (idempotent)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (idempotent)
DROP POLICY IF EXISTS "Users can upload their own post images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can read post images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own post images" ON storage.objects;

-- Policy 1: Allow authenticated users to upload files in their own folder
CREATE POLICY "Users can upload their own post images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'posts' AND
  (name ~ ('^' || auth.uid()::text || '/'))
);

-- Policy 2: Allow anyone to read post images (public bucket)
CREATE POLICY "Anyone can read post images"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'posts'
);

-- Policy 3: Allow authenticated users to delete files in their own folder
CREATE POLICY "Users can delete their own post images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'posts' AND
  (name ~ ('^' || auth.uid()::text || '/'))
);


