-- ============================================================================
-- Storage Policies Setup for identity-verifications bucket
-- ============================================================================
-- This file should be run directly in Supabase SQL Editor (not via migrations)
-- It requires elevated permissions to create policies on storage.objects
-- ============================================================================

-- Enable RLS on storage.objects (idempotent)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (idempotent)
DROP POLICY IF EXISTS "Users can upload their own identity documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can read their own identity documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own identity documents" ON storage.objects;
DROP POLICY IF EXISTS "Service role can manage all identity documents" ON storage.objects;

-- Policy: Allow authenticated users to upload files in their own folder
CREATE POLICY "Users can upload their own identity documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'identity-verifications' AND
  (name ~ ('^' || auth.uid()::text || '/'))
);

-- Policy: Allow authenticated users to read files in their own folder
CREATE POLICY "Users can read their own identity documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'identity-verifications' AND
  (name ~ ('^' || auth.uid()::text || '/'))
);

-- Policy: Allow authenticated users to delete files in their own folder
CREATE POLICY "Users can delete their own identity documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'identity-verifications' AND
  (name ~ ('^' || auth.uid()::text || '/'))
);

-- Policy: Allow service role to manage all files (for webhook cleanup)
CREATE POLICY "Service role can manage all identity documents"
ON storage.objects
FOR ALL
TO service_role
USING (bucket_id = 'identity-verifications')
WITH CHECK (bucket_id = 'identity-verifications');

