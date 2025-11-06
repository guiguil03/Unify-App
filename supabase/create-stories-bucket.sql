-- Création du bucket pour les stories
-- À exécuter dans l'éditeur SQL de Supabase

-- ============================================
-- BUCKET: stories (Stockage des images)
-- ============================================

-- Créer le bucket s'il n'existe pas
INSERT INTO storage.buckets (id, name, public)
VALUES ('stories', 'stories', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- POLICIES pour le bucket stories
-- ============================================

-- Politique: Les utilisateurs authentifiés peuvent uploader leurs propres stories
CREATE POLICY "Utilisateurs peuvent uploader leurs stories"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'stories' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Politique: Tout le monde peut voir les stories (bucket public)
CREATE POLICY "Stories sont publiques"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'stories');

-- Politique: Les utilisateurs peuvent supprimer leurs propres stories
CREATE POLICY "Utilisateurs peuvent supprimer leurs stories"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'stories' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================
-- CONFIGURATION du bucket
-- ============================================

-- Limiter la taille des fichiers à 5MB
UPDATE storage.buckets
SET file_size_limit = 5242880
WHERE id = 'stories';

-- Types de fichiers autorisés
UPDATE storage.buckets
SET allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
WHERE id = 'stories';

SELECT 'Bucket stories créé avec succès!' as status;

