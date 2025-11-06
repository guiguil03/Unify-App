-- Ajout de champs supplémentaires pour le profil utilisateur
-- À exécuter dans l'éditeur SQL de Supabase

-- Ajouter les nouveaux champs au profil
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS level TEXT CHECK (level IN ('beginner', 'intermediate', 'advanced', 'expert')),
  ADD COLUMN IF NOT EXISTS goal TEXT,
  ADD COLUMN IF NOT EXISTS preferred_time TEXT CHECK (preferred_time IN ('morning', 'afternoon', 'evening', 'night')),
  ADD COLUMN IF NOT EXISTS preferred_terrain TEXT, -- 'route', 'trail', 'track', 'mixed'
  ADD COLUMN IF NOT EXISTS group_preference TEXT CHECK (group_preference IN ('solo', 'group', 'both')),
  ADD COLUMN IF NOT EXISTS member_since TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Mettre à jour member_since pour les utilisateurs existants
UPDATE users 
SET member_since = created_at 
WHERE member_since IS NULL;

-- Confirmation
SELECT 'Champs de profil ajoutés avec succès!' as message;

