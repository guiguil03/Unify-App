# Guide de configuration Firebase pour Unify

## Problèmes potentiels de connexion Firebase et comment les résoudre

Si vous rencontrez des problèmes avec l'authentification Firebase, voici quelques étapes de dépannage à suivre :

### 1. Vérifier la configuration Firebase

Assurez-vous que les paramètres dans `src/config/firebase.ts` correspondent exactement à ceux de votre projet Firebase dans la console Firebase.

```typescript
const firebaseConfig = {
  apiKey: "AIzaSyDIJyjyh2j9pUzgRhUZLeRlzj23FDHQBiw",
  authDomain: "millecoeurs-ba7a7.firebaseapp.com",
  databaseURL: "https://millecoeurs-ba7a7-default-rtdb.firebaseio.com",
  projectId: "millecoeurs-ba7a7",
  storageBucket: "millecoeurs-ba7a7.firebasestorage.app",
  messagingSenderId: "397224772460",
  appId: "1:397224772460:web:b994c9511b12b9329a2949",
  measurementId: "G-3BY2NJZWC4"
};
```

### 2. Configurer les règles de sécurité Firebase

Dans la console Firebase, mettez à jour les règles de sécurité Firestore pour permettre l'authentification et l'accès aux données utilisateur.

Accédez à : Console Firebase > Firestore > Règles et collez ces règles :

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Règle pour permettre l'accès aux documents utilisateur authentifiés
    match /users/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Règle par défaut - refuser tout accès
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

### 3. Activer les méthodes d'authentification

Dans la console Firebase, activez les méthodes d'authentification par email/mot de passe :

1. Console Firebase > Authentication > Sign-in method
2. Cliquez sur "Email/Password"
3. Activez l'option "Email/Password"
4. Cliquez sur "Enregistrer"

### 4. Debugging des erreurs Firebase

Si vous rencontrez des erreurs spécifiques, vérifiez les logs dans la console de développement :

- Code `auth/invalid-email` : Format d'email invalide
- Code `auth/user-disabled` : Compte utilisateur désactivé
- Code `auth/user-not-found` ou `auth/wrong-password` : Email ou mot de passe incorrect
- Code `auth/email-already-in-use` : Email déjà utilisé pour un autre compte
- Code `auth/weak-password` : Mot de passe trop faible
- Code `permission-denied` : Problème avec les règles de sécurité Firebase

### 5. Problèmes de connexion

Vérifiez que votre appareil est bien connecté à Internet et que vous n'avez pas de restrictions réseau qui pourraient bloquer les connexions à Firebase.

## Configuration avancée (Optionnelle)

### Configurer l'authentification anonyme

Si vous souhaitez permettre une utilisation sans création de compte, activez l'authentification anonyme dans la console Firebase :

1. Console Firebase > Authentication > Sign-in method
2. Cliquez sur "Anonymous"
3. Activez l'option "Anonymous"
4. Cliquez sur "Enregistrer"

### Configurer le stockage Firebase

Pour permettre l'upload de photos/avatars utilisateur :

1. Console Firebase > Storage > Règles
2. Mettez à jour les règles pour permettre l'accès aux utilisateurs authentifiés :

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /users/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

## Tester l'authentification

Pour tester complètement l'authentification :

1. Essayez de créer un compte avec un email valide et un mot de passe
2. Essayez de vous connecter avec ce compte
3. Vérifiez dans la console Firebase si l'utilisateur a bien été créé
4. Vérifiez dans Firestore si le document utilisateur a bien été créé

Si vous rencontrez des problèmes persistants, contactez l'équipe de développement.
