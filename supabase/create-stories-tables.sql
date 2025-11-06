-- Création des tables stories et story_views
-- À exécuter dans l'éditeur SQL de Supabase

-- Activer l'extension pour les UUID si ce n'est pas déjà fait
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLE: stories (Stories des utilisateurs)
-- ============================================
CREATE TABLE IF NOT EXISTS stories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  image_url TEXT,
  video_url TEXT,
  caption TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  view_count INTEGER DEFAULT 0,
  location TEXT,
  -- Contraintes
  CONSTRAINT check_media_url CHECK (image_url IS NOT NULL OR video_url IS NOT NULL),
  CONSTRAINT valid_expiry CHECK (expires_at IS NULL OR expires_at > created_at)
);

-- ============================================
-- TABLE: story_views (Vues des stories)
-- ============================================
CREATE TABLE IF NOT EXISTS story_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  viewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Un utilisateur ne peut voir une story qu'une fois
  UNIQUE(story_id, viewer_id)
);

-- ============================================
-- INDEXES pour améliorer les performances
-- ============================================
CREATE INDEX IF NOT EXISTS idx_stories_user_id ON stories(user_id);
CREATE INDEX IF NOT EXISTS idx_stories_created_at ON stories(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stories_expires_at ON stories(expires_at DESC) WHERE expires_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_story_views_story_id ON story_views(story_id);
CREATE INDEX IF NOT EXISTS idx_story_views_viewer_id ON story_views(viewer_id);
CREATE INDEX IF NOT EXISTS idx_story_views_viewed_at ON story_views(viewed_at DESC);

-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger pour définir automatiquement expires_at à 24h après created_at
CREATE OR REPLACE FUNCTION set_story_expiry()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.expires_at IS NULL THEN
    NEW.expires_at := NEW.created_at + INTERVAL '24 hours';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_story_expiry ON stories;
CREATE TRIGGER trigger_set_story_expiry
  BEFORE INSERT ON stories
  FOR EACH ROW
  EXECUTE FUNCTION set_story_expiry();

-- Trigger pour incrémenter automatiquement le compteur de vues
CREATE OR REPLACE FUNCTION increment_story_views()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE stories
  SET view_count = view_count + 1
  WHERE id = NEW.story_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_increment_story_views ON story_views;
CREATE TRIGGER trigger_increment_story_views
  AFTER INSERT ON story_views
  FOR EACH ROW
  EXECUTE FUNCTION increment_story_views();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Activer RLS
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_views ENABLE ROW LEVEL SECURITY;

-- Policies pour stories
DROP POLICY IF EXISTS "Users can view active stories" ON stories;
CREATE POLICY "Users can view active stories" ON stories
  FOR SELECT USING (expires_at > NOW());

DROP POLICY IF EXISTS "Users can insert own stories" ON stories;
CREATE POLICY "Users can insert own stories" ON stories
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = stories.user_id 
      AND users.auth_user_id = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS "Users can delete own stories" ON stories;
CREATE POLICY "Users can delete own stories" ON stories
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = stories.user_id 
      AND users.auth_user_id = auth.uid()::text
    )
  );

-- Policies pour story_views
DROP POLICY IF EXISTS "Users can view story views" ON story_views;
CREATE POLICY "Users can view story views" ON story_views
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM stories 
      JOIN users ON users.id = stories.user_id
      WHERE stories.id = story_views.story_id 
      AND users.auth_user_id = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS "Users can insert own story views" ON story_views;
CREATE POLICY "Users can insert own story views" ON story_views
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = story_views.viewer_id 
      AND users.auth_user_id = auth.uid()::text
    )
  );

-- Confirmation
SELECT 'Tables stories créées avec succès!' as message;
SELECT 
  COUNT(*) as nombre_stories,
  COUNT(*) FILTER (WHERE expires_at > NOW()) as stories_actives
FROM stories;

