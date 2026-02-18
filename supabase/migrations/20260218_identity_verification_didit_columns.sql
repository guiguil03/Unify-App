-- Ajout des colonnes didit manquantes sur identity_verifications
ALTER TABLE identity_verifications
  ADD COLUMN IF NOT EXISTS didit_session_id TEXT,
  ADD COLUMN IF NOT EXISTS didit_submitted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS didit_completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS didit_decision_data JSONB,
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
