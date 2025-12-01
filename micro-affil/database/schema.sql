-- Script SQL pour créer les tables d'affiliation dans Supabase

-- Table des codes d'affiliation
CREATE TABLE IF NOT EXISTS affiliations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  code VARCHAR(8) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  used_count INTEGER DEFAULT 0,

  -- Contraintes
  CONSTRAINT code_format CHECK (code ~ '^[123456789ABCDEFGHJKLMNPQRSTUVWXYZ]{8}$')
);

-- Index pour les recherches fréquentes
CREATE INDEX idx_affiliations_code ON affiliations(code);
CREATE INDEX idx_affiliations_user_id ON affiliations(user_id);

-- Table des utilisations de codes d'affiliation
CREATE TABLE IF NOT EXISTS affiliation_usages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliation_id UUID NOT NULL REFERENCES affiliations(id) ON DELETE CASCADE,
  used_by_user_id UUID NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Contrainte : un utilisateur ne peut utiliser un code qu'une seule fois
  CONSTRAINT unique_usage_per_user UNIQUE (affiliation_id, used_by_user_id)
);

-- Index pour les recherches
CREATE INDEX idx_affiliation_usages_affiliation_id ON affiliation_usages(affiliation_id);
CREATE INDEX idx_affiliation_usages_used_by_user_id ON affiliation_usages(used_by_user_id);

-- Fonction pour incrémenter le compteur d'utilisation
CREATE OR REPLACE FUNCTION increment_affiliation_usage(affiliation_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE affiliations
  SET used_count = used_count + 1
  WHERE id = affiliation_id;
END;
$$ LANGUAGE plpgsql;

-- Commentaires
COMMENT ON TABLE affiliations IS 'Codes d''affiliation générés pour les utilisateurs';
COMMENT ON TABLE affiliation_usages IS 'Historique des utilisations de codes d''affiliation';
COMMENT ON COLUMN affiliations.code IS 'Code unique de 8 caractères (alphabet sans caractères ambigus)';
COMMENT ON COLUMN affiliations.used_count IS 'Nombre de fois que ce code a été utilisé';

-- Row Level Security (RLS)
ALTER TABLE affiliations ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliation_usages ENABLE ROW LEVEL SECURITY;

-- Politique : Les utilisateurs peuvent lire leur propre code
CREATE POLICY "Users can read their own affiliation code"
  ON affiliations FOR SELECT
  USING (auth.uid() = user_id);

-- Politique : Seul le service peut créer des codes
CREATE POLICY "Service can create affiliation codes"
  ON affiliations FOR INSERT
  WITH CHECK (true);

-- Politique : Les utilisateurs peuvent lire les usages de leur code
CREATE POLICY "Users can read usages of their code"
  ON affiliation_usages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM affiliations
      WHERE affiliations.id = affiliation_usages.affiliation_id
      AND affiliations.user_id = auth.uid()
    )
  );

-- Politique : Seul le service peut enregistrer des usages
CREATE POLICY "Service can record usages"
  ON affiliation_usages FOR INSERT
  WITH CHECK (true);
