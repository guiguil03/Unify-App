# 🌱 Scripts de peuplement (Seed) pour Supabase

Ce dossier contient des scripts SQL pour créer des données fictives dans votre base de données Supabase.

## 📋 Scripts disponibles

### 1. `seed-users.sql` - Créer des utilisateurs fictifs
Ce script crée 10 utilisateurs fictifs avec :
- Emails : `*@fictif.com`
- Noms réalistes
- Biographies personnalisées
- Avatars (via pravatar.cc)
- Statistiques de course variées

### 2. `seed-contacts.sql` - Créer des relations de contacts
Ce script crée :
- Des relations d'amitié entre vous et les utilisateurs fictifs
- Des demandes de contact en attente
- Des relations bidirectionnelles

## 🚀 Comment utiliser

### Méthode 1 : Via l'interface Supabase (recommandé)

1. Connectez-vous à votre projet Supabase : https://supabase.com/dashboard
2. Allez dans **SQL Editor** (menu de gauche)
3. Cliquez sur **New query**
4. Copiez le contenu de `seed-users.sql` et exécutez-le
5. Attendez la confirmation
6. Copiez le contenu de `seed-contacts.sql` et exécutez-le
7. ⚠️ **Important** : Modifiez l'email dans `seed-contacts.sql` avec votre email réel

### Méthode 2 : Via la CLI Supabase

```bash
# Installer la CLI Supabase si ce n'est pas déjà fait
npm install -g supabase

# Se connecter
supabase login

# Lier votre projet
supabase link --project-ref muhexuopzmqdxonurktn

# Exécuter les scripts
supabase db execute -f supabase/seed-users.sql
supabase db execute -f supabase/seed-contacts.sql
```

## ✅ Vérification

Après l'exécution, vérifiez que les données sont bien créées :

```sql
-- Vérifier les utilisateurs fictifs
SELECT name, email, total_distance, sessions 
FROM users 
WHERE email LIKE '%@fictif.com'
ORDER BY created_at DESC;

-- Vérifier vos contacts
SELECT 
  u.name,
  u.email,
  c.status,
  c.created_at
FROM contacts c
JOIN users u ON u.id = c.contact_id
WHERE c.user_id = (SELECT id FROM users WHERE email = 'VOTRE_EMAIL@gmail.com')
ORDER BY c.created_at DESC;
```

## 🗑️ Nettoyage

Pour supprimer toutes les données fictives :

```sql
-- Supprimer les contacts des utilisateurs fictifs
DELETE FROM contacts 
WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%@fictif.com')
   OR contact_id IN (SELECT id FROM users WHERE email LIKE '%@fictif.com');

-- Supprimer les utilisateurs fictifs
DELETE FROM users WHERE email LIKE '%@fictif.com';
```

## 📝 Personnalisation

Vous pouvez personnaliser les scripts :

1. Modifier les noms, emails, bios dans `seed-users.sql`
2. Ajouter plus d'utilisateurs (copier/coller un bloc et modifier les valeurs)
3. Changer votre email dans `seed-contacts.sql`
4. Ajuster le nombre de demandes en attente

## ⚠️ Notes importantes

- Ces scripts utilisent `ON CONFLICT DO NOTHING` pour éviter les doublons
- Les IDs des utilisateurs fictifs commencent par `fictif-XXX` pour faciliter l'identification
- Les avatars proviennent de [pravatar.cc](https://pravatar.cc) (service gratuit)
- Les statistiques sont réalistes pour simuler différents niveaux de coureurs
- Les dates de création sont aléatoires dans le passé pour plus de réalisme

