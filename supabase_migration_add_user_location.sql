-- Migration pour ajouter les colonnes de position à la table users
-- À exécuter dans le SQL Editor de Supabase

-- 1. Ajouter les colonnes de position à la table users
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS last_latitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS last_longitude DOUBLE PRECISION;

-- 2. Créer un index pour améliorer les performances des recherches de proximité
CREATE INDEX IF NOT EXISTS idx_users_location 
ON public.users (last_latitude, last_longitude) 
WHERE last_latitude IS NOT NULL AND last_longitude IS NOT NULL;

-- 3. Activer Row Level Security si ce n'est pas déjà fait
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 4. Politique pour permettre à tout le monde de voir les positions des autres utilisateurs
DROP POLICY IF EXISTS "Tout le monde peut voir les positions des utilisateurs" ON public.users;
CREATE POLICY "Tout le monde peut voir les positions des utilisateurs"
ON public.users
FOR SELECT
USING (true);

-- 5. Politique pour permettre aux utilisateurs de mettre à jour leur propre position
DROP POLICY IF EXISTS "Les utilisateurs peuvent mettre à jour leur position" ON public.users;
CREATE POLICY "Les utilisateurs peuvent mettre à jour leur position"
ON public.users
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 6. Activer Realtime sur la table users pour les changements de position
-- (À faire aussi via l'interface Supabase : Database > Replication)
ALTER PUBLICATION supabase_realtime ADD TABLE public.users;

-- 7. Vérifier que la table existe et afficher sa structure
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'users'
ORDER BY ordinal_position;

