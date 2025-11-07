# 🚀 Quick Start - Voir les utilisateurs proches

## 📝 Résumé rapide

Pour voir les autres utilisateurs sur la carte, il faut :

1. ✅ **Ajouter les colonnes de position à la table `users`**
2. ✅ **Activer Realtime sur Supabase**
3. ✅ **Tester l'app**

---

## 🔧 Étape 1 : Mise à jour de la base de données (2 min)

### Dans Supabase Dashboard

1. Allez sur https://supabase.com et connectez-vous
2. Sélectionnez votre projet Unify
3. Cliquez sur **SQL Editor** (icône </> dans le menu)
4. Cliquez sur **New Query**
5. Copiez-collez ce code :

```sql
-- Ajouter les colonnes de position
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS last_latitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS last_longitude DOUBLE PRECISION;

-- Créer un index pour les performances
CREATE INDEX IF NOT EXISTS idx_users_location 
ON public.users (last_latitude, last_longitude) 
WHERE last_latitude IS NOT NULL AND last_longitude IS NOT NULL;

-- Politique pour voir les positions des autres
DROP POLICY IF EXISTS "Tout le monde peut voir les positions des utilisateurs" ON public.users;
CREATE POLICY "Tout le monde peut voir les positions des utilisateurs"
ON public.users FOR SELECT USING (true);

-- Politique pour mettre à jour sa propre position
DROP POLICY IF EXISTS "Les utilisateurs peuvent mettre à jour leur position" ON public.users;
CREATE POLICY "Les utilisateurs peuvent mettre à jour leur position"
ON public.users FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);
```

6. Cliquez sur **Run** (ou Ctrl+Enter)
7. Vous devriez voir "Success. No rows returned"

---

## 📡 Étape 2 : Activer Realtime (1 min)

### Activer sur la table `users`

1. Dans Supabase, allez dans **Database** → **Replication**
2. Trouvez la table **users** dans la liste
3. Cliquez sur le bouton à droite de la ligne
4. Cochez **UPDATE**
5. Cliquez sur **Save**

### Activer sur la table `runners`

1. Toujours dans **Database** → **Replication**
2. Trouvez la table **runners**
3. Cochez **INSERT**, **UPDATE**, **DELETE**
4. Cliquez sur **Save**

---

## 🧪 Étape 3 : Tester (5 min)

### Test 1 : Vérifier la structure

Dans **SQL Editor**, exécutez :

```sql
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_name = 'users' 
AND column_name IN ('last_latitude', 'last_longitude');
```

✅ Vous devriez voir 2 lignes avec `last_latitude` et `last_longitude`

### Test 2 : Tester l'app

#### Sur l'appareil 1 (Utilisateur A)
1. Ouvrez l'app Unify
2. Connectez-vous ou continuez sans compte
3. Allez sur l'écran **Carte** (icône 🗺️)
4. Attendez que la carte se charge
5. Dans les logs, vous devriez voir :
   ```
   ✅ Position utilisateur mise à jour
   🔔 Abonnement aux changements des positions utilisateurs
   🔔 Statut de l'abonnement: SUBSCRIBED
   ```

#### Sur l'appareil 2 (Utilisateur B)
1. Ouvrez l'app Unify (autre compte ou autre appareil)
2. Allez sur l'écran **Carte**
3. **Vous devriez voir l'utilisateur A sur la carte !** 📍

### Test 3 : Tester le temps réel

#### Utilisateur A : Lance une activité
1. Allez sur l'écran **Accueil**
2. Cliquez sur **Démarrer une course**
3. Commencez à marcher/courir

#### Utilisateur B : Regarde la carte
1. Sur la carte, vous devriez voir :
   - Le marqueur de l'utilisateur A **bouger en temps réel** 🏃
   - Son statut passer à **"Connecté(e)"** avec un marqueur coloré
   - Son allure s'afficher (ex: "5:30 min/km")

---

## 🎯 Résultat attendu

### Sur la carte, vous verrez :

#### Utilisateurs proches (dans un rayon de 2.5 km)
- 📍 **Marqueur rouge/vert** = En cours d'activité
- 📍 **Marqueur gris** = Hors ligne
- 💬 **Nom de l'utilisateur**
- 📏 **Distance** (ex: "850 m")
- ⚡ **Allure** (si en activité)
- ✅ **Statut** : "Connecté(e)" ou "Hors ligne · il y a 2h"

#### En bas de l'écran
- 📋 **Liste des coureurs** (glissez vers le haut)
- 🔍 **Barre de recherche** (chercher une ville)
- ⚙️ **Réglages** (changer le rayon de recherche)

---

## ❓ Problèmes courants

### ❌ "Aucun utilisateur trouvé"

**Causes possibles :**
- Aucun autre utilisateur n'a ouvert la carte
- Les autres utilisateurs sont trop loin (> 2.5 km)
- Les colonnes `last_latitude`/`last_longitude` n'existent pas

**Solution :**
1. Vérifiez que vous avez bien exécuté le script SQL
2. Testez avec 2 appareils/comptes dans la même pièce
3. Augmentez le rayon de recherche (icône ⚙️ sur la carte)

### ❌ "Maximum update depth exceeded"

**Cause :** Boucle infinie dans le code

**Solution :** Redémarrez l'app (déjà corrigé dans le code)

### ❌ Les positions ne se mettent pas à jour

**Causes possibles :**
- Realtime pas activé sur Supabase
- Problème de connexion internet

**Solution :**
1. Vérifiez **Database** → **Replication** sur Supabase
2. Redémarrez l'app
3. Vérifiez les logs : cherchez "🔔 Statut de l'abonnement: SUBSCRIBED"

---

## 📊 Vérifier dans Supabase

### Voir les utilisateurs avec position

```sql
SELECT 
    name,
    last_latitude,
    last_longitude,
    updated_at
FROM public.users
WHERE last_latitude IS NOT NULL
ORDER BY updated_at DESC;
```

### Voir les activités en cours

```sql
SELECT 
    u.name,
    r.is_active,
    r.pace,
    r.updated_at
FROM public.runners r
JOIN public.users u ON r.user_id = u.id
WHERE r.is_active = true;
```

---

## 🎉 C'est tout !

Une fois ces 3 étapes complétées, vous devriez voir :
- ✅ Les autres utilisateurs sur la carte
- ✅ Leurs positions en temps réel
- ✅ Qui est en train de courir
- ✅ Qui est hors ligne

**Besoin d'aide ?** Consultez `INSTALLATION_SUPABASE.md` pour plus de détails.

