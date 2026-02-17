# Configuration du bucket photo_post

## Méthode 1 : Via l'interface Supabase (Recommandé)

### Étape 1 : Créer le bucket

1. Allez dans **Supabase Dashboard** > **Storage** > **Buckets**
2. Cliquez sur **"New bucket"**
3. Configurez le bucket :
   - **Name**: `photo_post`
   - **Public bucket**: ✅ Activé (cochez la case)
   - **File size limit**: `10485760` (10 MB)
   - **Allowed MIME types**: `image/jpeg, image/png, image/jpg, image/webp, image/gif`
4. Cliquez sur **"Create bucket"**

### Étape 2 : Configurer les politiques RLS

1. Allez dans **Storage** > **Policies**
2. Sélectionnez le bucket `photo_post`
3. Cliquez sur **"New Policy"** et créez les politiques suivantes :

#### Politique 1 : Upload (INSERT)
- **Policy name**: `Users can upload their own post images`
- **Allowed operation**: `INSERT`
- **Target roles**: `authenticated`
- **Policy definition**:
```sql
(bucket_id = 'photo_post'::text) AND ((name ~ (('^'::text || (auth.uid())::text) || '/'::text)))
```

#### Politique 2 : Lecture (SELECT)
- **Policy name**: `Anyone can read post images`
- **Allowed operation**: `SELECT`
- **Target roles**: `public`
- **Policy definition**:
```sql
(bucket_id = 'photo_post'::text)
```

#### Politique 3 : Suppression (DELETE)
- **Policy name**: `Users can delete their own post images`
- **Allowed operation**: `DELETE`
- **Target roles**: `authenticated`
- **Policy definition**:
```sql
(bucket_id = 'photo_post'::text) AND ((name ~ (('^'::text || (auth.uid())::text) || '/'::text)))
```

## Méthode 2 : Via SQL Editor (si vous avez les permissions admin)

Si vous avez accès au compte propriétaire du projet Supabase, vous pouvez exécuter le fichier `20260202_photo_post_setup.sql` dans le SQL Editor.

## Vérification

Après la configuration, testez l'upload d'une image dans l'application. Si vous avez encore des erreurs, vérifiez que :
- Le bucket `photo_post` existe et est public
- Les 3 politiques sont créées et actives
- L'utilisateur est bien authentifié lors de l'upload

