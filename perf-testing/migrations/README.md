# 🗄️ Migrations de Base de Données

Ce dossier contient les migrations SQL pour optimiser les performances de la base de données Supabase.

## 📋 Liste des Migrations

### 001_add_performance_indexes.sql
**Date**: 2025-11-07  
**Description**: Ajout d'indexes composites pour optimiser les requêtes critiques

**Indexes créés**:
- `idx_contacts_user_id_status` - Optimise les requêtes de contacts par utilisateur et statut
- `idx_contacts_contact_id_status` - Optimise les requêtes symétriques de contacts
- `idx_contacts_updated_at` - Optimise le tri par date de mise à jour
- `idx_users_location_not_null` - Optimise les requêtes géographiques (nearby runners)
- `idx_users_updated_at` - Optimise le filtrage des utilisateurs actifs récemment
- `idx_runners_user_id_active` - Optimise les requêtes de runners actifs
- `idx_runners_is_active` - Index partiel pour runners actifs uniquement
- `idx_activities_user_id_date` - Optimise l'historique d'activités par utilisateur
- `idx_activities_date` - Optimise le feed global d'activités
- `idx_chat_messages_conversation_created` - Optimise les conversations
- `idx_chat_messages_sender_read` - Optimise les compteurs de messages non lus
- `idx_conversations_user1_last_message` - Optimise la liste de conversations (user1)
- `idx_conversations_user2_last_message` - Optimise la liste de conversations (user2)
- `idx_stories_expires_at` - Optimise le filtrage des stories actives
- `idx_stories_user_created` - Optimise les stories par utilisateur

**Impact estimé**:
- Réduction latence p95 contacts: **-40%** (300ms → 180ms)
- Réduction latence p95 nearby-runners: **-20%** (avec indexes seuls, -60% avec PostGIS)
- Réduction latence p95 activities: **-30%** (400ms → 280ms)

---

## 🚀 Comment Appliquer les Migrations

### Méthode 1: Via l'interface Supabase (Recommandée)

1. Ouvrir le dashboard Supabase: https://app.supabase.com
2. Sélectionner votre projet **Unify**
3. Aller dans **SQL Editor** (menu de gauche)
4. Créer une nouvelle query
5. Copier-coller le contenu de `001_add_performance_indexes.sql`
6. Cliquer sur **Run** (ou F5)
7. Vérifier les résultats dans l'onglet **Results**

### Méthode 2: Via CLI Supabase

```bash
# Installer la CLI Supabase (si pas déjà fait)
npm install -g supabase

# Se connecter
supabase login

# Lier le projet
supabase link --project-ref muhexuopzmqdxonurktn

# Appliquer la migration
supabase db push --file perf-testing/migrations/001_add_performance_indexes.sql
```

### Méthode 3: Via psql (Avancé)

```bash
# Récupérer la connection string depuis Supabase Dashboard > Settings > Database
psql "postgresql://postgres:[PASSWORD]@db.muhexuopzmqdxonurktn.supabase.co:5432/postgres"

# Puis dans psql:
\i perf-testing/migrations/001_add_performance_indexes.sql
```

---

## ✅ Vérification Post-Migration

### 1. Vérifier que les indexes sont créés

```sql
SELECT 
  schemaname, 
  tablename, 
  indexname, 
  indexdef 
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;
```

**Résultat attendu**: 15 indexes commençant par `idx_`

### 2. Vérifier la taille des indexes

```sql
SELECT
  schemaname,
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%'
ORDER BY pg_relation_size(indexrelid) DESC;
```

### 3. Analyser l'utilisation des indexes

```sql
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan AS index_scans,
  idx_tup_read AS tuples_read,
  idx_tup_fetch AS tuples_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%'
ORDER BY idx_scan DESC;
```

**Note**: Les statistiques d'utilisation mettront quelques minutes/heures à se remplir après les tests k6.

---

## 🧪 Tests de Performance

### Avant/Après Comparaison

```bash
# 1. Baseline (AVANT les indexes)
git checkout perf-baseline
npm run test:stress
# Sauvegarder les résultats: results/baseline-before-indexes.json

# 2. Appliquer les migrations (voir ci-dessus)

# 3. After (APRÈS les indexes)
git checkout perf-after
npm run test:stress
# Sauvegarder les résultats: results/after-indexes.json

# 4. Comparer
npm run perf:compare
```

### EXPLAIN ANALYZE pour Validation

```sql
-- Test 1: Contacts avec index
EXPLAIN ANALYZE
SELECT c.*, u.name, u.avatar
FROM contacts c
JOIN users u ON u.id = c.contact_id
WHERE c.user_id = 'some-uuid'
  AND c.status = 'accepted';

-- Résultat attendu: "Index Scan using idx_contacts_user_id_status"

-- Test 2: Nearby runners avec index
EXPLAIN ANALYZE
SELECT id, name, avatar, last_latitude, last_longitude
FROM users
WHERE last_latitude IS NOT NULL
  AND last_longitude IS NOT NULL;

-- Résultat attendu: "Index Scan using idx_users_location_not_null"

-- Test 3: Activities avec index
EXPLAIN ANALYZE
SELECT *
FROM activities
WHERE user_id = 'some-uuid'
ORDER BY date DESC
LIMIT 50;

-- Résultat attendu: "Index Scan using idx_activities_user_id_date"
```

---

## 🔄 Rollback

Si les indexes causent des problèmes (peu probable), exécuter:

```sql
-- Supprimer tous les indexes de performance
DROP INDEX IF EXISTS idx_contacts_user_id_status;
DROP INDEX IF EXISTS idx_contacts_contact_id_status;
DROP INDEX IF EXISTS idx_contacts_updated_at;
DROP INDEX IF EXISTS idx_users_location_not_null;
DROP INDEX IF EXISTS idx_users_updated_at;
DROP INDEX IF EXISTS idx_runners_user_id_active;
DROP INDEX IF EXISTS idx_runners_is_active;
DROP INDEX IF EXISTS idx_activities_user_id_date;
DROP INDEX IF EXISTS idx_activities_date;
DROP INDEX IF EXISTS idx_chat_messages_conversation_created;
DROP INDEX IF EXISTS idx_chat_messages_receiver_read;
DROP INDEX IF EXISTS idx_conversations_user1_last_message;
DROP INDEX IF EXISTS idx_conversations_user2_last_message;
DROP INDEX IF EXISTS idx_stories_expires_at;
DROP INDEX IF EXISTS idx_stories_user_created;
```

---

## 📊 Impact Estimé par Endpoint

| Endpoint | Latence p95 Avant | Latence p95 Après | Amélioration |
|----------|-------------------|-------------------|--------------|
| `GET /api/contacts` | 300ms | 180ms | **-40%** |
| `GET /api/users` | 250ms | 200ms | **-20%** |
| `GET /api/runners` | 200ms | 150ms | **-25%** |
| `GET /api/activities` | 400ms | 280ms | **-30%** |
| `GET /api/messages` | 350ms | 245ms | **-30%** |

**Note**: Ces chiffres sont des estimations. Les résultats réels dépendent de:
- Volume de données
- Charge simultanée
- Latence réseau Supabase
- Configuration du pool de connexions

---

## 🎯 Prochaines Optimisations

Après validation des indexes, considérer:

1. **PostGIS pour géolocalisation** (nearby-runners)
   - Remplacer calculs Haversine côté app par `ST_DWithin`
   - Impact estimé: **-60%** latence nearby-runners

2. **Cache Redis** (contacts, users)
   - TTL 30s pour données peu changeantes
   - Impact estimé: **-70%** latence en cache hit

3. **Pagination keyset** (activities, messages)
   - Remplacer OFFSET par WHERE id > last_id
   - Impact estimé: **-50%** latence sur grandes listes

4. **Materialized Views** (stats, leaderboards)
   - Précalculer agrégations coûteuses
   - Impact estimé: **-90%** latence endpoints stats

---

## 📚 Ressources

- [PostgreSQL Index Types](https://www.postgresql.org/docs/current/indexes-types.html)
- [Supabase Performance Guide](https://supabase.com/docs/guides/platform/performance)
- [Index Tuning Tutorial](https://use-the-index-luke.com/)
- [EXPLAIN ANALYZE Guide](https://www.postgresql.org/docs/current/using-explain.html)

---

**Créé le**: 2025-11-07  
**Auteur**: Équipe Unify  
**Version**: 1.0.0

