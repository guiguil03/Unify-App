-- Create storage bucket if it doesn't exist
-- Note: Storage policies must be created via Supabase Dashboard or Management API
-- See instructions below for setting up policies

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'identity-verifications',
  'identity-verifications',
  false, -- Private bucket
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/jpg', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies cannot be created via SQL migrations.
-- You must create them manually in the Supabase Dashboard:
--
-- 1. Go to Storage > Policies in your Supabase Dashboard
-- 2. Select the 'identity-verifications' bucket
-- 3. Create the following policies:
--
-- Policy 1: "Users can upload their own identity documents"
--   - Operation: INSERT
--   - Target roles: authenticated
--   - Policy definition:
--     (bucket_id = 'identity-verifications' AND (name ~ ('^' || auth.uid()::text || '/')))
--
-- Policy 2: "Users can read their own identity documents"
--   - Operation: SELECT
--   - Target roles: authenticated
--   - Policy definition:
--     (bucket_id = 'identity-verifications' AND (name ~ ('^' || auth.uid()::text || '/')))
--
-- Policy 3: "Users can delete their own identity documents"
--   - Operation: DELETE
--   - Target roles: authenticated
--   - Policy definition:
--     (bucket_id = 'identity-verifications' AND (name ~ ('^' || auth.uid()::text || '/')))
--
-- Policy 4: "Service role can manage all identity documents"
--   - Operation: ALL
--   - Target roles: service_role
--   - Policy definition:
--     (bucket_id = 'identity-verifications')

