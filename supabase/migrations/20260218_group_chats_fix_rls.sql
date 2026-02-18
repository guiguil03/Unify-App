-- ================================================
-- Fix: infinite recursion in group_members RLS
-- Run this in Supabase SQL Editor
-- ================================================

-- Supprimer les policies récursives
DROP POLICY IF EXISTS "group_members_select" ON group_members;
DROP POLICY IF EXISTS "group_chats_select" ON group_chats;
DROP POLICY IF EXISTS "group_messages_select" ON group_chat_messages;
DROP POLICY IF EXISTS "group_members_insert" ON group_members;
DROP POLICY IF EXISTS "group_chats_insert" ON group_chats;
DROP POLICY IF EXISTS "group_chats_update" ON group_chats;
DROP POLICY IF EXISTS "group_messages_insert" ON group_chat_messages;

-- Supprimer les anciennes fonctions si elles existent
DROP FUNCTION IF EXISTS public.is_group_member(UUID);
DROP FUNCTION IF EXISTS public.is_group_admin(UUID);

-- ------------------------------------------------
-- Fonction SECURITY DEFINER : retourne les IDs des
-- groupes dont l'utilisateur est membre.
-- Tourne en tant que postgres (bypass RLS) → pas de récursion.
-- ------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_my_group_ids()
RETURNS SETOF UUID AS $$
  SELECT group_chat_id
  FROM group_members
  WHERE user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

-- ------------------------------------------------
-- Recréer les policies sans récursion
-- ------------------------------------------------

-- group_chats
CREATE POLICY "group_chats_select" ON group_chats
  FOR SELECT USING (id IN (SELECT get_my_group_ids()));

CREATE POLICY "group_chats_insert" ON group_chats
  FOR INSERT WITH CHECK (creator_id = auth.uid());

CREATE POLICY "group_chats_update" ON group_chats
  FOR UPDATE USING (
    id IN (SELECT get_my_group_ids())
    AND creator_id = auth.uid()
  );

-- group_members
CREATE POLICY "group_members_select" ON group_members
  FOR SELECT USING (group_chat_id IN (SELECT get_my_group_ids()));

CREATE POLICY "group_members_insert" ON group_members
  FOR INSERT WITH CHECK (
    group_chat_id IN (
      SELECT id FROM group_chats WHERE creator_id = auth.uid()
    )
  );

-- group_chat_messages
CREATE POLICY "group_messages_select" ON group_chat_messages
  FOR SELECT USING (group_chat_id IN (SELECT get_my_group_ids()));

CREATE POLICY "group_messages_insert" ON group_chat_messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid()
    AND group_chat_id IN (SELECT get_my_group_ids())
  );
