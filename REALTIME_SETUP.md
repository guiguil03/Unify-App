# Configuration Realtime Supabase pour Unify

## ✅ Ce qui a été fait dans le code

1. **Ajout de la synchronisation temps réel** dans `RunnersService.ts`
   - Méthode `subscribeToRunners()` pour s'abonner aux changements
   - Méthode `unsubscribeFromRunners()` pour se désabonner
   - Écoute des changements sur la table `users` (positions) ET `runners` (activités)
   - Méthode `updateUserLocation()` pour mettre à jour la position d'un utilisateur

2. **Activation automatique dans MapScreen**
   - Abonnement automatique quand la carte se charge
   - Mise à jour automatique de votre position quand vous ouvrez la carte
   - Rechargement automatique des utilisateurs à proximité à chaque changement
   - Désabonnement automatique quand on quitte la carte

3. **Affichage de TOUS les utilisateurs proches**
   - Pas seulement ceux qui courent
   - Tous les utilisateurs qui ont partagé leur position
   - Distinction visuelle entre ceux qui courent (actifs) et les autres

## 🔧 Configuration Supabase requise

### 1. Activer Realtime sur la table `runners`

Dans votre dashboard Supabase :

1. Allez dans **Database** → **Replication**
2. Trouvez la table `runners`
3. Activez les options suivantes :
   - ✅ **INSERT**
   - ✅ **UPDATE**
   - ✅ **DELETE**
4. Cliquez sur **Save**

### 2. Vérifier les Row Level Security (RLS)

La table `runners` doit avoir des politiques RLS qui permettent :

```sql
-- Politique pour lire tous les coureurs (nécessaire pour voir les autres)
CREATE POLICY "Tout le monde peut voir les coureurs"
ON public.runners
FOR SELECT
USING (true);

-- Politique pour mettre à jour sa propre position
CREATE POLICY "Les utilisateurs peuvent mettre à jour leur position"
ON public.runners
FOR UPDATE
USING (auth.uid() = user_id);

-- Politique pour insérer sa propre position
CREATE POLICY "Les utilisateurs peuvent insérer leur position"
ON public.runners
FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

### 3. Vérifier que Realtime est activé globalement

Dans **Settings** → **API** :
- Vérifiez que **Realtime** est activé
- Notez l'URL Realtime (doit être visible)

## 🧪 Comment tester

### Test 1 : Vérifier l'abonnement
1. Ouvrez l'app sur un appareil
2. Allez sur l'écran Carte
3. Dans les logs, vous devriez voir :
   ```
   🔔 Activation de la synchronisation en temps réel des coureurs
   🔔 Abonnement aux changements de la table runners
   🔔 Statut de l'abonnement runners: SUBSCRIBED
   ```

### Test 2 : Voir les autres utilisateurs
1. **Utilisateur A** : Lance une activité (bouton "Démarrer une course")
   - Sa position est envoyée à Supabase toutes les 10 secondes
   - `is_active = true` dans la table `runners`

2. **Utilisateur B** : Ouvre l'écran Carte
   - Devrait voir l'utilisateur A apparaître sur la carte
   - Avec un marqueur coloré et le statut "Connecté(e)"

3. **Utilisateur A** : Se déplace
   - Sa position se met à jour dans Supabase
   - L'utilisateur B voit le marqueur bouger automatiquement

4. **Utilisateur A** : Termine l'activité
   - `is_active = false`
   - L'utilisateur B voit le marqueur devenir gris avec "Hors ligne"

## 🐛 Dépannage

### Les utilisateurs n'apparaissent pas
1. Vérifiez que l'utilisateur a bien lancé une activité (bouton "Démarrer une course")
2. Vérifiez dans Supabase → **Table Editor** → `runners` que des lignes existent
3. Vérifiez que `latitude` et `longitude` ne sont pas NULL
4. Vérifiez que l'utilisateur est dans le rayon de recherche (par défaut 2.5 km)

### Realtime ne fonctionne pas
1. Vérifiez les logs : cherchez "🔔 Statut de l'abonnement"
2. Si le statut est "CHANNEL_ERROR" ou "TIMED_OUT" :
   - Vérifiez que Realtime est activé sur la table dans Supabase
   - Vérifiez les politiques RLS
   - Redémarrez l'app

### Les positions ne se mettent pas à jour
1. L'utilisateur doit avoir une **activité en cours** (pas juste ouvrir l'app)
2. Les positions sont envoyées toutes les **10 secondes** pendant une activité
3. Vérifiez dans les logs : cherchez "✅ Position du coureur mise à jour"

## 📱 Flux complet

```
Utilisateur A                    Supabase                    Utilisateur B
     |                              |                              |
     |-- Lance une activité ------->|                              |
     |                              |                              |
     |-- Position toutes les 10s -->|                              |
     |   (lat, lng, is_active=true) |                              |
     |                              |                              |
     |                              |<---- Ouvre la carte ---------|
     |                              |                              |
     |                              |-- Envoie liste coureurs ---->|
     |                              |                              |
     |                              |<-- S'abonne Realtime --------|
     |                              |                              |
     |-- Nouvelle position -------->|                              |
     |                              |                              |
     |                              |-- 🔔 Changement détecté ---->|
     |                              |                              |
     |                              |<-- Recharge coureurs --------|
     |                              |                              |
     |                              |-- Nouvelles données -------->|
     |                              |   (marqueur se déplace)      |
```

## 🎯 Résultat attendu

Une fois configuré, vous devriez voir :
- ✅ Les utilisateurs qui courent en temps réel sur la carte
- ✅ Leurs positions se mettre à jour automatiquement
- ✅ Le statut "Connecté(e)" ou "Hors ligne"
- ✅ L'allure et la distance parcourue
- ✅ Les marqueurs colorés (rouge = actif, gris = inactif)

