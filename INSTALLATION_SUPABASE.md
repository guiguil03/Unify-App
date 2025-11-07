# Guide d'installation Supabase pour Unify

## 📋 Prérequis

- Un compte Supabase (gratuit sur https://supabase.com)
- Un projet Supabase créé

## 🗄️ Structure de la base de données

### Tables nécessaires

#### 1. Table `users`
```sql
CREATE TABLE public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE,
    name TEXT,
    avatar TEXT,
    bio TEXT,
    last_latitude DOUBLE PRECISION,
    last_longitude DOUBLE PRECISION,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

#### 2. Table `runners`
```sql
CREATE TABLE public.runners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    distance DOUBLE PRECISION,
    pace TEXT,
    pace_seconds INTEGER,
    is_active BOOLEAN DEFAULT false,
    activity_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id)
);
```

#### 3. Table `contacts`
```sql
CREATE TABLE public.contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, contact_id)
);
```

#### 4. Table `activities`
```sql
CREATE TABLE public.activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    distance DOUBLE PRECISION,
    duration TEXT,
    date TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

## 🚀 Installation étape par étape

### Étape 1 : Créer les tables

1. Allez dans votre dashboard Supabase
2. Cliquez sur **SQL Editor** dans le menu de gauche
3. Cliquez sur **New Query**
4. Copiez-collez le contenu du fichier `supabase_migration_add_user_location.sql`
5. Cliquez sur **Run** (ou Ctrl+Enter)

### Étape 2 : Activer Realtime

#### Sur la table `users`
1. Allez dans **Database** → **Replication**
2. Trouvez la table `users`
3. Activez **UPDATE** (pour détecter les changements de position)
4. Cliquez sur **Save**

#### Sur la table `runners`
1. Dans **Database** → **Replication**
2. Trouvez la table `runners`
3. Activez :
   - ✅ **INSERT** (nouvelle activité)
   - ✅ **UPDATE** (mise à jour position)
   - ✅ **DELETE** (fin d'activité)
4. Cliquez sur **Save**

### Étape 3 : Configurer les politiques RLS (Row Level Security)

Les politiques sont déjà créées par le script SQL, mais voici ce qu'elles font :

#### Table `users`
```sql
-- Lecture : tout le monde peut voir les utilisateurs
CREATE POLICY "Tout le monde peut voir les positions des utilisateurs"
ON public.users FOR SELECT USING (true);

-- Mise à jour : chacun peut mettre à jour sa propre position
CREATE POLICY "Les utilisateurs peuvent mettre à jour leur position"
ON public.users FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);
```

#### Table `runners`
```sql
-- Lecture : tout le monde peut voir les coureurs
CREATE POLICY "Tout le monde peut voir les coureurs"
ON public.runners FOR SELECT USING (true);

-- Insertion : chacun peut insérer sa propre position
CREATE POLICY "Les utilisateurs peuvent insérer leur position"
ON public.runners FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Mise à jour : chacun peut mettre à jour sa propre position
CREATE POLICY "Les utilisateurs peuvent mettre à jour leur position"
ON public.runners FOR UPDATE
USING (auth.uid() = user_id);
```

### Étape 4 : Vérifier la configuration

Exécutez cette requête pour vérifier que tout est en place :

```sql
-- Vérifier la structure de la table users
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'users'
ORDER BY ordinal_position;

-- Vérifier les politiques RLS
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename IN ('users', 'runners')
ORDER BY tablename, policyname;

-- Vérifier que Realtime est activé
SELECT * FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime';
```

### Étape 5 : Configurer l'app

1. Récupérez votre **URL** et **anon key** depuis **Settings** → **API**
2. Mettez-les dans `src/config/supabase.ts` :

```typescript
export const supabaseUrl = 'https://votre-projet.supabase.co';
export const supabaseAnonKey = 'votre-anon-key';
```

## 🧪 Tester la configuration

### Test 1 : Vérifier la connexion
```sql
-- Dans SQL Editor, exécutez :
SELECT * FROM public.users LIMIT 5;
```

### Test 2 : Tester l'insertion de position
```sql
-- Insérer un utilisateur de test
INSERT INTO public.users (name, email, last_latitude, last_longitude)
VALUES ('Test User', 'test@example.com', 48.8566, 2.3522);

-- Vérifier
SELECT id, name, last_latitude, last_longitude FROM public.users;
```

### Test 3 : Tester Realtime
1. Ouvrez l'app sur un appareil
2. Allez sur l'écran Carte
3. Dans les logs, cherchez :
   ```
   🔔 Abonnement aux changements des positions utilisateurs
   🔔 Statut de l'abonnement: SUBSCRIBED
   ```

## 📱 Comment ça marche dans l'app

### Quand un utilisateur ouvre la carte
1. Sa position GPS est récupérée
2. Elle est enregistrée dans `users.last_latitude` et `users.last_longitude`
3. L'app charge tous les utilisateurs dans un rayon de 2.5 km
4. L'app s'abonne aux changements en temps réel

### Quand un utilisateur lance une activité
1. Sa position est enregistrée dans `runners` avec `is_active = true`
2. Toutes les 10 secondes, sa position est mise à jour dans `runners` ET `users`
3. Les autres utilisateurs voient son marqueur bouger en temps réel

### Quand un utilisateur termine son activité
1. `runners.is_active` passe à `false`
2. Son marqueur devient gris avec "Hors ligne"
3. Sa dernière position reste visible dans `users`

## 🎨 Affichage sur la carte

### Utilisateur en cours d'activité (is_active = true)
- 🏃 Marqueur coloré (rouge/vert)
- 📍 Position en temps réel
- ⚡ Allure affichée (ex: "5:30 min/km")
- ✅ Statut "Connecté(e)"

### Utilisateur hors ligne (is_active = false)
- 👤 Marqueur gris
- 📍 Dernière position connue
- 🕐 Temps depuis dernière vue (ex: "il y a 2h")
- ⚪ Statut "Hors ligne"

## 🔒 Sécurité et confidentialité

### Qui peut voir ma position ?
- Tous les utilisateurs de l'app peuvent voir votre dernière position
- Seulement si vous avez ouvert la carte ou lancé une activité
- Vous pouvez désactiver le partage en ne lançant pas d'activité

### Que faire pour ne pas être visible ?
- Ne pas ouvrir l'écran Carte
- Ne pas lancer d'activité
- Votre position ne sera pas partagée

### Données stockées
- Position GPS (latitude, longitude)
- Horodatage de la dernière mise à jour
- Informations d'activité (distance, allure) si en cours

## 🐛 Dépannage

### Erreur : "relation users does not exist"
→ La table n'existe pas, exécutez le script SQL de création

### Erreur : "column last_latitude does not exist"
→ Exécutez le script de migration `supabase_migration_add_user_location.sql`

### Les utilisateurs n'apparaissent pas
1. Vérifiez que des utilisateurs ont ouvert la carte (position enregistrée)
2. Vérifiez le rayon de recherche (par défaut 2.5 km)
3. Vérifiez les politiques RLS

### Realtime ne fonctionne pas
1. Vérifiez que Realtime est activé sur `users` et `runners`
2. Vérifiez les logs : cherchez "🔔 Statut de l'abonnement"
3. Redémarrez l'app

## 📊 Requêtes utiles pour le debug

```sql
-- Voir tous les utilisateurs avec position
SELECT id, name, last_latitude, last_longitude, updated_at
FROM public.users
WHERE last_latitude IS NOT NULL
ORDER BY updated_at DESC;

-- Voir les activités en cours
SELECT u.name, r.latitude, r.longitude, r.pace, r.is_active, r.updated_at
FROM public.runners r
JOIN public.users u ON r.user_id = u.id
WHERE r.is_active = true
ORDER BY r.updated_at DESC;

-- Compter les utilisateurs par statut
SELECT 
    COUNT(*) FILTER (WHERE last_latitude IS NOT NULL) as avec_position,
    COUNT(*) FILTER (WHERE last_latitude IS NULL) as sans_position,
    COUNT(*) as total
FROM public.users;

-- Voir les dernières mises à jour de position
SELECT 
    u.name,
    u.last_latitude,
    u.last_longitude,
    u.updated_at,
    r.is_active,
    r.pace
FROM public.users u
LEFT JOIN public.runners r ON u.id = r.user_id
WHERE u.last_latitude IS NOT NULL
ORDER BY u.updated_at DESC
LIMIT 10;
```

## ✅ Checklist finale

- [ ] Tables créées (`users`, `runners`, `contacts`, `activities`)
- [ ] Colonnes `last_latitude` et `last_longitude` ajoutées à `users`
- [ ] Index créés pour les performances
- [ ] RLS activé sur toutes les tables
- [ ] Politiques RLS configurées
- [ ] Realtime activé sur `users` (UPDATE)
- [ ] Realtime activé sur `runners` (INSERT, UPDATE, DELETE)
- [ ] URL et anon key configurées dans l'app
- [ ] Test de connexion réussi
- [ ] Test d'insertion réussi
- [ ] Test Realtime réussi

## 🎉 Vous êtes prêt !

Une fois toutes ces étapes complétées, votre app devrait :
- ✅ Afficher les utilisateurs proches sur la carte
- ✅ Mettre à jour les positions en temps réel
- ✅ Distinguer les utilisateurs actifs et hors ligne
- ✅ Permettre de voir qui est dans le coin

