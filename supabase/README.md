# Configuration Supabase pour Unify App

Ce dossier contient le schéma de base de données pour l'application Unify.

## 📋 Tables créées

Le schéma inclut les tables suivantes :

1. **users** - Profils utilisateurs
2. **activities** - Activités de course
3. **activity_routes** - Coordonnées GPS des routes
4. **activity_pauses** - Pauses pendant les activités
5. **events** - Événements de course
6. **event_participants** - Participants aux événements
7. **contacts** - Relations entre utilisateurs
8. **conversations** - Conversations de chat
9. **chat_messages** - Messages individuels
10. **runners** - Positions en temps réel des coureurs
11. **user_settings** - Paramètres utilisateur

## 🚀 Installation

### Étape 1 : Créer les tables dans Supabase

1. Connectez-vous à votre dashboard Supabase : https://supabase.com/dashboard
2. Sélectionnez votre projet (muhexuopzmqdxonurktn)
3. Allez dans **SQL Editor**
4. Ouvrez le fichier `schema.sql`
5. Copiez tout le contenu
6. Collez-le dans l'éditeur SQL de Supabase
7. Cliquez sur **Run** pour exécuter le script

### Étape 2 : Vérifier les tables

Après l'exécution, vérifiez que toutes les tables ont été créées :
- Allez dans **Table Editor** dans le dashboard Supabase
- Vous devriez voir toutes les tables listées ci-dessus

### Étape 3 : Configurer l'authentification

Si vous utilisez Supabase Auth, assurez-vous que :
- L'authentification est activée dans le dashboard
- Les policies RLS (Row Level Security) sont actives (déjà incluses dans le schéma)

## 🔒 Sécurité (RLS)

Toutes les tables ont Row Level Security (RLS) activé avec des policies appropriées :
- Les utilisateurs peuvent voir les données publiques
- Les utilisateurs ne peuvent modifier que leurs propres données
- Les conversations et messages sont accessibles uniquement aux participants

## 📝 Notes importantes

1. **Extension PostGIS** : Le schéma tente d'activer PostGIS pour les requêtes géospatiales avancées. Si vous n'en avez pas besoin, vous pouvez commenter cette ligne dans le schéma SQL.

2. **Auth User ID** : La colonne `auth_user_id` dans la table `users` doit correspondre à l'ID de l'utilisateur authentifié via Supabase Auth (`auth.uid()`).

3. **Indexes** : Des indexes ont été créés pour optimiser les performances des requêtes fréquentes (activités par utilisateur, messages par conversation, etc.).

4. **Triggers** : Plusieurs triggers automatiques sont configurés :
   - Mise à jour automatique de `updated_at`
   - Mise à jour du nombre de participants d'un événement
   - Mise à jour de la dernière conversation
   - Création automatique des paramètres utilisateur

## 🧪 Tester la connexion

Utilisez le fichier `test-connection.ts` pour tester la connexion à Supabase.

## 📚 Documentation Supabase

Pour plus d'informations, consultez la documentation Supabase :
- https://supabase.com/docs
- https://supabase.com/docs/guides/auth
- https://supabase.com/docs/guides/database/postgres/row-level-security

