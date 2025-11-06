-- Mise à jour du schéma stories pour utiliser image_url et video_url séparés
-- À exécuter dans l'éditeur SQL de Supabase

-- 1. Ajouter les nouvelles colonnes
ALTER TABLE stories 
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS video_url TEXT;

-- 2. Migrer les données existantes de media_url vers les nouvelles colonnes
UPDATE stories 
SET 
  image_url = CASE WHEN media_type = 'image' THEN media_url ELSE NULL END,
  video_url = CASE WHEN media_type = 'video' THEN media_url ELSE NULL END
WHERE media_url IS NOT NULL;

-- 3. Supprimer les anciennes colonnes (optionnel, à faire après vérification)
-- ALTER TABLE stories DROP COLUMN IF EXISTS media_url;
-- ALTER TABLE stories DROP COLUMN IF EXISTS media_type;

-- 4. Renommer view_count en view_count si nécessaire
DO $$
BEGIN
  IF EXISTS(SELECT 1 FROM information_schema.columns 
            WHERE table_name='stories' AND column_name='views_count') THEN
    ALTER TABLE stories RENAME COLUMN views_count TO view_count;
  END IF;
END $$;

-- 5. Ajouter une contrainte pour s'assurer qu'au moins une URL est présente
ALTER TABLE stories 
  DROP CONSTRAINT IF EXISTS check_media_url;

ALTER TABLE stories 
  ADD CONSTRAINT check_media_url 
  CHECK (image_url IS NOT NULL OR video_url IS NOT NULL);

-- 6. Mettre à jour les indexes si nécessaire
CREATE INDEX IF NOT EXISTS idx_stories_expires_at_active ON stories(expires_at) 
WHERE expires_at > NOW();

-- Confirmation
SELECT 'Schéma stories mis à jour avec succès!' as message;
SELECT 
  COUNT(*) FILTER (WHERE image_url IS NOT NULL) as stories_avec_images,
  COUNT(*) FILTER (WHERE video_url IS NOT NULL) as stories_avec_videos,
  COUNT(*) as total_stories
FROM stories;

