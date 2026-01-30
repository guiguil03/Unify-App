-- ============================================================================
-- Fix Storage Policies for identity-verifications bucket
-- ============================================================================
-- This removes incorrect policies and creates the correct ones
-- Run this in Supabase SQL Editor
-- ============================================================================

-- Drop all existing incorrect policies for identity-verifications bucket
DROP POLICY IF EXISTS "Give anon users access to JPG images in folder 1cecstl_0" ON storage.objects;
DROP POLICY IF EXISTS "Give anon users access to JPG images in folder 1cecstl_1" ON storage.objects;
DROP POLICY IF EXISTS "Give anon users access to JPG images in folder 1cecstl_2" ON storage.objects;

-- Drop our correct policies if they exist (idempotent)
DROP POLICY IF EXISTS "Users can upload their own identity documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can read their own identity documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own identity documents" ON storage.objects;
DROP POLICY IF EXISTS "Service role can manage all identity documents" ON storage.objects;

-- Enable RLS on storage.objects (idempotent)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy 1: Allow authenticated users to upload files in their own folder
CREATE POLICY "Users can upload their own identity documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'identity-verifications' AND
  (name ~ ('^' || auth.uid()::text || '/'))
);

-- Policy 2: Allow authenticated users to read files in their own folder
CREATE POLICY "Users can read their own identity documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'identity-verifications' AND
  (name ~ ('^' || auth.uid()::text || '/'))
);

-- Policy 3: Allow authenticated users to delete files in their own folder
CREATE POLICY "Users can delete their own identity documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'identity-verifications' AND
  (name ~ ('^' || auth.uid()::text || '/'))
);

-- Policy 4: Allow service role to manage all files (for webhook cleanup)
CREATE POLICY "Service role can manage all identity documents"
ON storage.objects
FOR ALL
TO service_role
USING (bucket_id = 'identity-verifications')
WITH CHECK (bucket_id = 'identity-verifications');

