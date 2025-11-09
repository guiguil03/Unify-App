-- ============================================
-- Migration: Indexes de Performance
-- Date: 2025-11-07
-- Description: Ajout d'indexes composites pour optimiser les requêtes critiques
-- ============================================

-- ============================================
-- 1. CONTACTS - Optimisation des requêtes de relations
-- ============================================

-- Index composite pour les requêtes WHERE user_id = X AND status = 'accepted'
-- Utilisé par: GET /api/contacts, getFriends(), getContactRequests()
CREATE INDEX IF NOT EXISTS idx_contacts_user_id_status 
ON public.contacts (user_id, status);

-- Index composite pour les requêtes WHERE contact_id = X AND status = 'accepted'
-- Utilisé par: GET /api/contacts (requêtes symétriques)
CREATE INDEX IF NOT EXISTS idx_contacts_contact_id_status 
ON public.contacts (contact_id, status);

-- Index pour les requêtes de recherche par date de mise à jour
-- Utilisé pour: trier les contacts récents
CREATE INDEX IF NOT EXISTS idx_contacts_updated_at 
ON public.contacts (updated_at DESC);

-- ============================================
-- 2. USERS - Optimisation des requêtes géographiques
-- ============================================

-- Index composite pour les requêtes WHERE last_latitude IS NOT NULL AND last_longitude IS NOT NULL
-- Utilisé par: GET /api/users, getNearbyRunners()
CREATE INDEX IF NOT EXISTS idx_users_location_not_null 
ON public.users (last_latitude, last_longitude) 
WHERE last_latitude IS NOT NULL AND last_longitude IS NOT NULL;

-- Index pour les requêtes par updated_at (utilisateurs actifs récemment)
-- Utilisé pour: filtrer les utilisateurs actifs dans les dernières X minutes
CREATE INDEX IF NOT EXISTS idx_users_updated_at 
ON public.users (updated_at DESC) 
WHERE last_latitude IS NOT NULL AND last_longitude IS NOT NULL;

-- ============================================
-- 3. RUNNERS - Optimisation des requêtes d'activités en cours
-- ============================================

-- Index composite pour les requêtes WHERE user_id IN (...) AND is_active = true
-- Utilisé par: GET /api/runners, getNearbyRunners()
CREATE INDEX IF NOT EXISTS idx_runners_user_id_active 
ON public.runners (user_id, is_active);

-- Index pour les runners actifs uniquement
-- Utilisé pour: filtrer rapidement les coureurs en activité
CREATE INDEX IF NOT EXISTS idx_runners_is_active 
ON public.runners (is_active) 
WHERE is_active = true;

-- ============================================
-- 4. ACTIVITIES - Optimisation de l'historique
-- ============================================

-- Index composite pour les requêtes WHERE user_id = X ORDER BY date DESC
-- Utilisé par: GET /api/activities, getActivities()
CREATE INDEX IF NOT EXISTS idx_activities_user_id_date 
ON public.activities (user_id, date DESC);

-- Index pour les activités récentes (toutes utilisateurs)
-- Utilisé pour: feed d'activités globales
CREATE INDEX IF NOT EXISTS idx_activities_date 
ON public.activities (date DESC);

-- ============================================
-- 5. CHAT_MESSAGES - Optimisation des conversations
-- ============================================

-- Index composite pour les requêtes WHERE conversation_id = X ORDER BY created_at DESC
-- Utilisé par: GET /api/messages, getMessages()
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_created 
ON public.chat_messages (conversation_id, created_at DESC);

-- Index pour les messages non lus (utilise read_at IS NULL au lieu de is_read)
-- Utilisé par: compteur de notifications
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_read 
ON public.chat_messages (sender_id, read_at) 
WHERE read_at IS NULL;

-- ============================================
-- 6. CONVERSATIONS - Optimisation de la liste de conversations
-- ============================================

-- Index composite pour les requêtes WHERE user1_id = X OR user2_id = X ORDER BY last_message_time DESC
-- Utilisé par: GET /api/conversations, getConversations()
CREATE INDEX IF NOT EXISTS idx_conversations_user1_last_message 
ON public.conversations (user1_id, last_message_time DESC);

CREATE INDEX IF NOT EXISTS idx_conversations_user2_last_message 
ON public.conversations (user2_id, last_message_time DESC);

-- ============================================
-- 7. STORIES - Optimisation du feed de stories
-- ============================================

-- Index pour les stories non expirées
-- Utilisé par: GET /api/stories, getStories()
-- Note: Pas de WHERE expires_at > NOW() car NOW() n'est pas IMMUTABLE
CREATE INDEX IF NOT EXISTS idx_stories_expires_at 
ON public.stories (expires_at DESC);

-- Index composite pour les stories d'un utilisateur
CREATE INDEX IF NOT EXISTS idx_stories_user_created 
ON public.stories (user_id, created_at DESC);

-- ============================================
-- VÉRIFICATION DES INDEXES CRÉÉS
-- ============================================

-- Commande pour vérifier les indexes créés:
-- SELECT schemaname, tablename, indexname, indexdef 
-- FROM pg_indexes 
-- WHERE schemaname = 'public' 
-- AND indexname LIKE 'idx_%'
-- ORDER BY tablename, indexname;

-- ============================================
-- ANALYSE DES PERFORMANCES
-- ============================================

-- Après création des indexes, lancer ANALYZE pour mettre à jour les statistiques:
ANALYZE public.contacts;
ANALYZE public.users;
ANALYZE public.runners;
ANALYZE public.activities;
ANALYZE public.chat_messages;
ANALYZE public.conversations;
ANALYZE public.stories;

-- ============================================
-- ROLLBACK (si nécessaire)
-- ============================================

-- DROP INDEX IF EXISTS idx_contacts_user_id_status;
-- DROP INDEX IF EXISTS idx_contacts_contact_id_status;
-- DROP INDEX IF EXISTS idx_contacts_updated_at;
-- DROP INDEX IF EXISTS idx_users_location_not_null;
-- DROP INDEX IF EXISTS idx_users_updated_at;
-- DROP INDEX IF EXISTS idx_runners_user_id_active;
-- DROP INDEX IF EXISTS idx_runners_is_active;
-- DROP INDEX IF EXISTS idx_activities_user_id_date;
-- DROP INDEX IF EXISTS idx_activities_date;
-- DROP INDEX IF EXISTS idx_chat_messages_conversation_created;
-- DROP INDEX IF EXISTS idx_chat_messages_sender_read;
-- DROP INDEX IF EXISTS idx_conversations_user1_last_message;
-- DROP INDEX IF EXISTS idx_conversations_user2_last_message;
-- DROP INDEX IF EXISTS idx_stories_expires_at;
-- DROP INDEX IF EXISTS idx_stories_user_created;

