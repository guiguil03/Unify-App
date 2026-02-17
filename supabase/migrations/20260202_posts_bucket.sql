-- Create storage bucket for posts images
-- Note: Storage policies must be created via Supabase Dashboard or Management API
-- See instructions below for setting up policies

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'posts',
  'posts',
  true, -- Public bucket (images de posts accessibles publiquement)
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- IMPORTANT: After creating the bucket, you MUST run the policies SQL file:
-- Run the file: 20260202_posts_policies.sql
-- This file contains the RLS policies needed for the bucket to work.
--
-- To run it:
-- 1. Go to Supabase Dashboard > SQL Editor
-- 2. Copy and paste the contents of 20260202_posts_policies.sql
-- 3. Click "Run" to execute the policies


