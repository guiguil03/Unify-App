# Correction : Connexion Google OAuth en développement local

## Le problème

En développement local avec Expo Go, Safari ne peut pas ouvrir la page OAuth car :
- Le scheme personnalisé (`com.unify.app://`) n'est pas enregistré dans Expo Go
- L'URL de redirection ne fonctionne pas correctement
- Le navigateur ne peut pas rediriger vers l'application

## Solution appliquée

Le code a été modifié pour utiliser `useProxy: true` en développement. Cela permet à Expo de gérer la redirection via son serveur proxy.

### Changements dans `AuthService.ts`

```typescript
const redirectTo = AuthSession.makeRedirectUri({
  scheme: 'com.unify.app',
  path: 'auth/callback',
  useProxy: __DEV__, // Utiliser le proxy Expo en développement
});
```

## Comment ça fonctionne

### En développement (`__DEV__ = true`)
- Utilise le proxy Expo (`exp://` ou `https://auth.expo.io`)
- Expo gère la redirection automatiquement
- Fonctionne avec Expo Go

### En production (`__DEV__ = false`)
- Utilise le scheme personnalisé (`com.unify.app://`)
- L'app native gère la redirection
- Fonctionne avec les builds EAS

## Vérification

1. **En développement** : L'URL de redirection devrait ressembler à :
   ```
   https://auth.expo.io/@votre-compte/unify
   ```
   ou
   ```
   exp://localhost:8081
   ```

2. **En production** : L'URL de redirection devrait ressembler à :
   ```
   com.unify.app://auth/callback
   ```

## Configuration Supabase

### URLs de redirection autorisées

Dans votre configuration Google OAuth (Google Cloud Console), vous devez avoir :

**Pour le développement :**
- `https://auth.expo.io/@votre-compte/unify`
- `exp://localhost:8081` (si utilisé)

**Pour la production :**
- `com.unify.app://auth/callback`
- `https://muhexuopzmqdxonurktn.supabase.co/auth/v1/callback`

### Dans Supabase Dashboard

1. Allez dans **Authentication** > **URL Configuration**
2. Ajoutez les URLs de redirection :
   - `https://auth.expo.io/@votre-compte/unify` (développement)
   - `com.unify.app://auth/callback` (production)

## Test

1. Redémarrez votre serveur Expo :
   ```bash
   npx expo start --clear
   ```

2. Testez la connexion Google :
   - L'authentification devrait maintenant fonctionner
   - Le navigateur devrait se fermer automatiquement après connexion
   - Vous devriez être redirigé vers l'app

## Dépannage

### Erreur : "redirect_uri_mismatch"
- Vérifiez que l'URL de redirection dans Google Cloud Console correspond exactement à celle générée
- Vérifiez les logs pour voir l'URL exacte utilisée

### Erreur : "Connection refused"
- Vérifiez que le serveur Expo est bien démarré
- Vérifiez que vous êtes sur le même réseau (pour le proxy)

### Le navigateur s'ouvre mais ne se ferme pas
- Vérifiez que `WebBrowser.maybeCompleteAuthSession()` est appelé
- Vérifiez que l'URL de redirection correspond exactement

## Notes

- Le proxy Expo fonctionne uniquement en développement
- En production, vous devez utiliser le scheme personnalisé
- Les builds EAS utilisent automatiquement le bon scheme

