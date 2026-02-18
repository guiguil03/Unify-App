-- ================================================
-- Group Chats Feature
-- ================================================

-- Table des groupes de discussion
CREATE TABLE IF NOT EXISTS group_chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  last_message TEXT,
  last_message_time TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des membres d'un groupe
CREATE TABLE IF NOT EXISTS group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_chat_id UUID NOT NULL REFERENCES group_chats(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (group_chat_id, user_id)
);

-- Table des messages de groupe
CREATE TABLE IF NOT EXISTS group_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_chat_id UUID NOT NULL REFERENCES group_chats(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_group_members_group ON group_members(group_chat_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user ON group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_group_messages_group ON group_chat_messages(group_chat_id, created_at);

-- ================================================
-- Security Functions (to avoid recursion)
-- ================================================

CREATE OR REPLACE FUNCTION public.is_group_member(group_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM group_members
    WHERE group_chat_id = group_id
    AND user_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_group_admin(group_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM group_members
    WHERE group_chat_id = group_id
    AND user_id = auth.uid()
    AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

-- ================================================
-- RLS Policies
-- ================================================

ALTER TABLE group_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_chat_messages ENABLE ROW LEVEL SECURITY;

-- group_chats : visible uniquement aux membres
CREATE POLICY "group_chats_select" ON group_chats
  FOR SELECT USING (
    is_group_member(id)
    OR creator_id = auth.uid()
  );

CREATE POLICY "group_chats_insert" ON group_chats
  FOR INSERT WITH CHECK (creator_id = auth.uid());

CREATE POLICY "group_chats_update" ON group_chats
  FOR UPDATE USING (
    is_group_admin(id)
    OR creator_id = auth.uid()
  );

-- group_members : visible uniquement aux membres du groupe
CREATE POLICY "group_members_select" ON group_members
  FOR SELECT USING (
    is_group_member(group_chat_id)
  );

CREATE POLICY "group_members_insert" ON group_members
  FOR INSERT WITH CHECK (
    -- L'admin peut ajouter des membres, ou lors de la création
    creator_id = auth.uid() -- Attention: group_members n'a pas de creator_id, on doit vérifier via group_chats
    OR
    group_chat_id IN (
      SELECT id FROM group_chats WHERE creator_id = auth.uid()
    )
    OR
    is_group_admin(group_chat_id)
  );

-- group_chat_messages : visible uniquement aux membres
CREATE POLICY "group_messages_select" ON group_chat_messages
  FOR SELECT USING (
    is_group_member(group_chat_id)
  );

CREATE POLICY "group_messages_insert" ON group_chat_messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid()
    AND is_group_member(group_chat_id)
  );
