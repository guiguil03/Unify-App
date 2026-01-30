-- Add didit fields to identity_verifications table
ALTER TABLE public.identity_verifications
ADD COLUMN IF NOT EXISTS didit_session_id TEXT,
ADD COLUMN IF NOT EXISTS didit_decision_data JSONB,
ADD COLUMN IF NOT EXISTS didit_submitted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS didit_completed_at TIMESTAMP WITH TIME ZONE;

-- Create index for faster lookups by didit_session_id
CREATE INDEX IF NOT EXISTS idx_identity_verifications_didit_session
ON public.identity_verifications(didit_session_id);

-- Add comment to explain the columns
COMMENT ON COLUMN public.identity_verifications.didit_session_id IS 'Session ID from didit verification service';
COMMENT ON COLUMN public.identity_verifications.didit_decision_data IS 'Full decision data from didit webhook';
COMMENT ON COLUMN public.identity_verifications.didit_submitted_at IS 'Timestamp when verification was submitted to didit';
COMMENT ON COLUMN public.identity_verifications.didit_completed_at IS 'Timestamp when didit completed the verification';
