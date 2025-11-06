-- ============================================
-- SCHEMA SUPABASE POUR UNIFY APP
-- ============================================
-- Ce fichier contient toutes les tables nécessaires pour l'application Unify
-- Exécutez ce script dans l'éditeur SQL de Supabase

-- ============================================
-- EXTENSIONS
-- ============================================
-- Activer l'extension PostGIS pour les données géographiques (optionnel mais recommandé)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- ============================================
-- TABLE: users (Utilisateurs)
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  avatar TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Données supplémentaires pour le profil
  bio TEXT,
  gender TEXT CHECK (gender IN ('male', 'female', 'other', NULL)),
  birth_date DATE,
  -- Statistiques de profil
  total_distance NUMERIC(10, 2) DEFAULT 0,
  total_time TEXT DEFAULT '0 min',
  sessions INTEGER DEFAULT 0,
  average_pace TEXT,
  -- Authentification
  auth_user_id TEXT UNIQUE -- ID de l'utilisateur depuis Supabase Auth
);

-- ============================================
-- TABLE: activities (Activités de course)
-- ============================================
CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  distance NUMERIC(10, 2) NOT NULL, -- Distance en kilomètres
  duration TEXT NOT NULL, -- Durée formatée (ex: "28 min")
  duration_seconds INTEGER, -- Durée en secondes pour les calculs
  pace TEXT NOT NULL, -- Allure formatée (ex: "5:23 min/km")
  pace_seconds INTEGER, -- Allure en secondes par km
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Métadonnées supplémentaires
  title TEXT,
  notes TEXT,
  weather TEXT,
  feeling TEXT CHECK (feeling IN ('excellent', 'good', 'ok', 'tough', NULL))
);

-- ============================================
-- TABLE: activity_routes (Coordonnées des routes)
-- ============================================
CREATE TABLE IF NOT EXISTS activity_routes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  latitude NUMERIC(10, 8) NOT NULL,
  longitude NUMERIC(11, 8) NOT NULL,
  timestamp INTEGER NOT NULL, -- Timestamp Unix en millisecondes
  altitude NUMERIC(8, 2), -- Altitude en mètres
  accuracy NUMERIC(8, 2), -- Précision GPS en mètres
  speed NUMERIC(8, 2), -- Vitesse en m/s
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Index pour améliorer les performances
  CONSTRAINT valid_coordinates CHECK (
    latitude >= -90 AND latitude <= 90 AND
    longitude >= -180 AND longitude <= 180
  )
);

-- ============================================
-- TABLE: activity_pauses (Pauses pendant les activités)
-- ============================================
CREATE TABLE IF NOT EXISTS activity_pauses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  start_time INTEGER NOT NULL, -- Timestamp Unix en millisecondes
  end_time INTEGER NOT NULL, -- Timestamp Unix en millisecondes
  latitude NUMERIC(10, 8) NOT NULL,
  longitude NUMERIC(11, 8) NOT NULL,
  reason TEXT, -- Raison de la pause
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT valid_pause_time CHECK (end_time > start_time),
  CONSTRAINT valid_pause_coordinates CHECK (
    latitude >= -90 AND latitude <= 90 AND
    longitude >= -180 AND longitude <= 180
  )
);

-- ============================================
-- TABLE: events (Événements de course)
-- ============================================
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  location TEXT NOT NULL, -- Adresse textuelle
  latitude NUMERIC(10, 8),
  longitude NUMERIC(11, 8),
  participants INTEGER DEFAULT 0,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Informations supplémentaires
  max_participants INTEGER,
  distance NUMERIC(10, 2), -- Distance prévue de l'événement
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard', NULL)),
  registration_required BOOLEAN DEFAULT false,
  -- Contraintes
  CONSTRAINT valid_event_coordinates CHECK (
    (latitude IS NULL AND longitude IS NULL) OR
    (latitude >= -90 AND latitude <= 90 AND
     longitude >= -180 AND longitude <= 180)
  )
);

-- ============================================
-- TABLE: event_participants (Participants aux événements)
-- ============================================
CREATE TABLE IF NOT EXISTS event_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'registered' CHECK (status IN ('registered', 'attended', 'cancelled')),
  UNIQUE(event_id, user_id)
);

-- ============================================
-- TABLE: contacts (Contacts entre utilisateurs)
-- ============================================
CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Métadonnées
  last_interaction TIMESTAMP WITH TIME ZONE,
  -- Contrainte pour éviter les doublons et l'auto-contact
  UNIQUE(user_id, contact_id),
  CONSTRAINT no_self_contact CHECK (user_id != contact_id)
);

-- ============================================
-- TABLE: conversations (Conversations de chat)
-- ============================================
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user1_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  last_message TEXT,
  last_message_time TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Contrainte pour éviter les doublons
  UNIQUE(user1_id, user2_id),
  CONSTRAINT no_self_conversation CHECK (user1_id != user2_id)
);

-- ============================================
-- TABLE: chat_messages (Messages de chat)
-- ============================================
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Métadonnées
  read_at TIMESTAMP WITH TIME ZONE,
  edited_at TIMESTAMP WITH TIME ZONE,
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- ============================================
-- TABLE: runners (Positions en temps réel des coureurs)
-- ============================================
CREATE TABLE IF NOT EXISTS runners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  latitude NUMERIC(10, 8) NOT NULL,
  longitude NUMERIC(11, 8) NOT NULL,
  distance NUMERIC(10, 2), -- Distance parcourue dans la session actuelle
  pace TEXT, -- Allure actuelle
  pace_seconds INTEGER, -- Allure en secondes par km
  is_active BOOLEAN DEFAULT true, -- Si le coureur est actuellement en train de courir
  activity_id UUID REFERENCES activities(id) ON DELETE SET NULL, -- Activité en cours
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Contraintes
  CONSTRAINT valid_runner_coordinates CHECK (
    latitude >= -90 AND latitude <= 90 AND
    longitude >= -180 AND longitude <= 180
  ),
  UNIQUE(user_id) -- Un utilisateur ne peut avoir qu'une seule position active
);

-- ============================================
-- TABLE: user_settings (Paramètres utilisateur)
-- ============================================
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  same_gender_only BOOLEAN DEFAULT false,
  hide_exact_location BOOLEAN DEFAULT false,
  similar_pace_only BOOLEAN DEFAULT false,
  similar_schedule BOOLEAN DEFAULT false,
  nearby_runners_notifications BOOLEAN DEFAULT true,
  -- Paramètres de notification supplémentaires
  message_notifications BOOLEAN DEFAULT true,
  event_notifications BOOLEAN DEFAULT true,
  activity_reminders BOOLEAN DEFAULT true,
  -- Tolérances pour les filtres
  pace_tolerance INTEGER DEFAULT 30, -- Tolérance d'allure en secondes
  distance_tolerance NUMERIC(8, 2) DEFAULT 5.0, -- Distance maximale pour les coureurs proches (km)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TABLE: stories (Stories des utilisateurs)
-- ============================================
CREATE TABLE IF NOT EXISTS stories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  media_url TEXT NOT NULL, -- URL de l'image ou vidéo
  media_type TEXT DEFAULT 'image' CHECK (media_type IN ('image', 'video')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE, -- Date d'expiration de la story (24h par défaut)
  views_count INTEGER DEFAULT 0,
  -- Métadonnées supplémentaires
  caption TEXT,
  location TEXT,
  -- Contrainte pour s'assurer que expires_at est après created_at
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
-- TABLE: notifications (Notifications utilisateur)
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('message', 'event', 'activity', 'contact', 'runner', 'system')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB, -- Données supplémentaires en JSON (ex: { activityId: "...", eventId: "..." })
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Métadonnées
  action_url TEXT, -- URL ou route vers l'action associée
  icon TEXT -- Icône ou emoji pour la notification
);

-- ============================================
-- INDEXES pour améliorer les performances
-- ============================================

-- Index pour users
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON users(auth_user_id);

-- Index pour activities
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_date ON activities(date DESC);

-- Index pour activity_routes
CREATE INDEX IF NOT EXISTS idx_activity_routes_activity_id ON activity_routes(activity_id);
CREATE INDEX IF NOT EXISTS idx_activity_routes_timestamp ON activity_routes(timestamp);

-- Index pour activity_pauses
CREATE INDEX IF NOT EXISTS idx_activity_pauses_activity_id ON activity_pauses(activity_id);

-- Index pour events
CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);
CREATE INDEX IF NOT EXISTS idx_events_created_by ON events(created_by);

-- Index pour event_participants
CREATE INDEX IF NOT EXISTS idx_event_participants_event_id ON event_participants(event_id);
CREATE INDEX IF NOT EXISTS idx_event_participants_user_id ON event_participants(user_id);

-- Index pour contacts
CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_contacts_contact_id ON contacts(contact_id);
CREATE INDEX IF NOT EXISTS idx_contacts_status ON contacts(status);

-- Index pour conversations
CREATE INDEX IF NOT EXISTS idx_conversations_user1_id ON conversations(user1_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user2_id ON conversations(user2_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_time ON conversations(last_message_time DESC);

-- Index pour chat_messages
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_id ON chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_id ON chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at DESC);

-- Index pour runners (très important pour les requêtes de position)
CREATE INDEX IF NOT EXISTS idx_runners_user_id ON runners(user_id);
CREATE INDEX IF NOT EXISTS idx_runners_is_active ON runners(is_active);
CREATE INDEX IF NOT EXISTS idx_runners_updated_at ON runners(updated_at DESC);
-- Index géospatial pour les requêtes de proximité (nécessite PostGIS)
-- CREATE INDEX IF NOT EXISTS idx_runners_location ON runners USING GIST (ST_SetSRID(ST_MakePoint(longitude, latitude), 4326));

-- Index pour user_settings
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);

-- Index pour stories
CREATE INDEX IF NOT EXISTS idx_stories_user_id ON stories(user_id);
CREATE INDEX IF NOT EXISTS idx_stories_created_at ON stories(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stories_expires_at ON stories(expires_at) WHERE expires_at IS NOT NULL;

-- Index pour story_views
CREATE INDEX IF NOT EXISTS idx_story_views_story_id ON story_views(story_id);
CREATE INDEX IF NOT EXISTS idx_story_views_viewer_id ON story_views(viewer_id);
CREATE INDEX IF NOT EXISTS idx_story_views_viewed_at ON story_views(viewed_at DESC);

-- Index pour notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_read_at ON notifications(read_at) WHERE read_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- ============================================
-- TRIGGERS pour mettre à jour updated_at automatiquement
-- ============================================

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Appliquer le trigger aux tables concernées
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_activities_updated_at BEFORE UPDATE ON activities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger pour définir automatiquement expires_at à 24h après created_at pour les stories
CREATE OR REPLACE FUNCTION set_story_expiry()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.expires_at IS NULL THEN
    NEW.expires_at = NEW.created_at + INTERVAL '24 hours';
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER set_story_expiry_trigger
  BEFORE INSERT ON stories
  FOR EACH ROW EXECUTE FUNCTION set_story_expiry();

-- Trigger pour incrémenter views_count quand une story est vue
CREATE OR REPLACE FUNCTION increment_story_views()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE stories
  SET views_count = views_count + 1
  WHERE id = NEW.story_id;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER increment_story_views_trigger
  AFTER INSERT ON story_views
  FOR EACH ROW EXECUTE FUNCTION increment_story_views();

-- ============================================
-- ROW LEVEL SECURITY (RLS) Policies
-- ============================================

-- Activer RLS sur toutes les tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_pauses ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE runners ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policies pour users (les utilisateurs peuvent voir les profils publics, mais modifier uniquement le leur)
CREATE POLICY "Users can view all profiles" ON users
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid()::text = auth_user_id);

CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (auth.uid()::text = auth_user_id);

-- Policies pour activities (les utilisateurs peuvent voir toutes les activités, mais modifier uniquement les leurs)
CREATE POLICY "Users can view all activities" ON activities
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own activities" ON activities
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = activities.user_id 
      AND users.auth_user_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can update own activities" ON activities
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = activities.user_id 
      AND users.auth_user_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can delete own activities" ON activities
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = activities.user_id 
      AND users.auth_user_id = auth.uid()::text
    )
  );

-- Policies pour activity_routes (même logique que activities)
CREATE POLICY "Users can view activity routes" ON activity_routes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM activities 
      WHERE activities.id = activity_routes.activity_id
    )
  );

CREATE POLICY "Users can manage own activity routes" ON activity_routes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM activities 
      JOIN users ON users.id = activities.user_id
      WHERE activities.id = activity_routes.activity_id 
      AND users.auth_user_id = auth.uid()::text
    )
  );

-- Policies pour activity_pauses (même logique)
CREATE POLICY "Users can view activity pauses" ON activity_pauses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM activities 
      WHERE activities.id = activity_pauses.activity_id
    )
  );

CREATE POLICY "Users can manage own activity pauses" ON activity_pauses
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM activities 
      JOIN users ON users.id = activities.user_id
      WHERE activities.id = activity_pauses.activity_id 
      AND users.auth_user_id = auth.uid()::text
    )
  );

-- Policies pour events (tous peuvent voir, créer et modifier leurs propres événements)
CREATE POLICY "Users can view all events" ON events
  FOR SELECT USING (true);

CREATE POLICY "Users can create events" ON events
  FOR INSERT WITH CHECK (
    created_by IS NULL OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = events.created_by 
      AND users.auth_user_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can update own events" ON events
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = events.created_by 
      AND users.auth_user_id = auth.uid()::text
    )
  );

-- Policies pour event_participants
CREATE POLICY "Users can view event participants" ON event_participants
  FOR SELECT USING (true);

CREATE POLICY "Users can manage own event participation" ON event_participants
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = event_participants.user_id 
      AND users.auth_user_id = auth.uid()::text
    )
  );

-- Policies pour contacts
CREATE POLICY "Users can view own contacts" ON contacts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE (users.id = contacts.user_id OR users.id = contacts.contact_id)
      AND users.auth_user_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can manage own contacts" ON contacts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = contacts.user_id 
      AND users.auth_user_id = auth.uid()::text
    )
  );

-- Policies pour conversations
CREATE POLICY "Users can view own conversations" ON conversations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE (users.id = conversations.user1_id OR users.id = conversations.user2_id)
      AND users.auth_user_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can create own conversations" ON conversations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE (users.id = conversations.user1_id OR users.id = conversations.user2_id)
      AND users.auth_user_id = auth.uid()::text
    )
  );

-- Policies pour chat_messages
CREATE POLICY "Users can view messages in own conversations" ON chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversations
      JOIN users ON (users.id = conversations.user1_id OR users.id = conversations.user2_id)
      WHERE conversations.id = chat_messages.conversation_id
      AND users.auth_user_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can send messages in own conversations" ON chat_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = chat_messages.sender_id 
      AND users.auth_user_id = auth.uid()::text
    )
    AND EXISTS (
      SELECT 1 FROM conversations
      JOIN users ON (users.id = conversations.user1_id OR users.id = conversations.user2_id)
      WHERE conversations.id = chat_messages.conversation_id
      AND users.auth_user_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can update own messages" ON chat_messages
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = chat_messages.sender_id 
      AND users.auth_user_id = auth.uid()::text
    )
  );

-- Policies pour runners (tous peuvent voir les coureurs actifs, mais modifier uniquement leur position)
CREATE POLICY "Users can view active runners" ON runners
  FOR SELECT USING (is_active = true);

CREATE POLICY "Users can manage own runner position" ON runners
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = runners.user_id 
      AND users.auth_user_id = auth.uid()::text
    )
  );

-- Policies pour user_settings
CREATE POLICY "Users can view own settings" ON user_settings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = user_settings.user_id 
      AND users.auth_user_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can manage own settings" ON user_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = user_settings.user_id 
      AND users.auth_user_id = auth.uid()::text
    )
  );

-- Policies pour stories (tous peuvent voir les stories non expirées, mais créer/modifier uniquement les leurs)
CREATE POLICY "Users can view active stories" ON stories
  FOR SELECT USING (
    expires_at IS NULL OR expires_at > NOW()
  );

CREATE POLICY "Users can create own stories" ON stories
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = stories.user_id 
      AND users.auth_user_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can update own stories" ON stories
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = stories.user_id 
      AND users.auth_user_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can delete own stories" ON stories
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = stories.user_id 
      AND users.auth_user_id = auth.uid()::text
    )
  );

-- Policies pour story_views
CREATE POLICY "Users can view story views" ON story_views
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM stories 
      WHERE stories.id = story_views.story_id
    )
  );

CREATE POLICY "Users can create story views" ON story_views
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = story_views.viewer_id 
      AND users.auth_user_id = auth.uid()::text
    )
    AND EXISTS (
      SELECT 1 FROM stories 
      WHERE stories.id = story_views.story_id
      AND (stories.expires_at IS NULL OR stories.expires_at > NOW())
    )
  );

-- Policies pour notifications (les utilisateurs ne peuvent voir que leurs propres notifications)
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = notifications.user_id 
      AND users.auth_user_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = notifications.user_id 
      AND users.auth_user_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can delete own notifications" ON notifications
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = notifications.user_id 
      AND users.auth_user_id = auth.uid()::text
    )
  );

-- Les notifications peuvent être créées par le système ou d'autres utilisateurs (via des triggers/functions)
-- Cette policy permet à n'importe quel utilisateur authentifié de créer des notifications pour d'autres utilisateurs
-- En production, vous pourriez vouloir restreindre cela davantage
CREATE POLICY "Authenticated users can create notifications" ON notifications
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================
-- FONCTIONS UTILITAIRES
-- ============================================

-- Fonction pour mettre à jour automatiquement le nombre de participants d'un événement
CREATE OR REPLACE FUNCTION update_event_participants_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE events
  SET participants = (
    SELECT COUNT(*) 
    FROM event_participants 
    WHERE event_id = events.id 
    AND status = 'registered'
  )
  WHERE id = COALESCE(NEW.event_id, OLD.event_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

CREATE TRIGGER update_event_participants_count_trigger
  AFTER INSERT OR UPDATE OR DELETE ON event_participants
  FOR EACH ROW EXECUTE FUNCTION update_event_participants_count();

-- Fonction pour mettre à jour automatiquement les informations de dernière conversation
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET last_message = NEW.content,
      last_message_time = NEW.created_at,
      updated_at = NOW()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_conversation_last_message_trigger
  AFTER INSERT ON chat_messages
  FOR EACH ROW EXECUTE FUNCTION update_conversation_last_message();

-- Fonction pour créer automatiquement les paramètres utilisateur lors de la création d'un utilisateur
CREATE OR REPLACE FUNCTION create_user_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_settings (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER create_user_settings_trigger
  AFTER INSERT ON users
  FOR EACH ROW EXECUTE FUNCTION create_user_settings();

-- ============================================
-- COMMENTAIRES SUR LES TABLES
-- ============================================

COMMENT ON TABLE users IS 'Table principale des utilisateurs de l''application';
COMMENT ON TABLE activities IS 'Activités de course enregistrées par les utilisateurs';
COMMENT ON TABLE activity_routes IS 'Coordonnées GPS des routes d''activités';
COMMENT ON TABLE activity_pauses IS 'Pauses effectuées pendant les activités';
COMMENT ON TABLE events IS 'Événements de course organisés par la communauté';
COMMENT ON TABLE event_participants IS 'Participants aux événements';
COMMENT ON TABLE contacts IS 'Relations entre utilisateurs (amis/contacts)';
COMMENT ON TABLE conversations IS 'Conversations de chat entre utilisateurs';
COMMENT ON TABLE chat_messages IS 'Messages individuels dans les conversations';
COMMENT ON TABLE runners IS 'Positions en temps réel des coureurs actifs';
COMMENT ON TABLE user_settings IS 'Paramètres et préférences utilisateur';
COMMENT ON TABLE stories IS 'Stories des utilisateurs (expirent après 24h)';
COMMENT ON TABLE story_views IS 'Vues des stories par les utilisateurs';
COMMENT ON TABLE notifications IS 'Notifications utilisateur (messages, événements, etc.)';

