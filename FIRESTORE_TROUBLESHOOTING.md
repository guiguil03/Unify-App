# Résolution du problème : Utilisateur créé mais pas enregistré dans Firestore

## Le problème

Vous avez remarqué que lorsque vous créez un nouveau compte utilisateur, celui-ci peut se connecter, mais ses données ne sont pas enregistrées dans la base de données Firestore.

Ce comportement s'explique par le fait que Firebase Authentication et Firestore sont deux services distincts :
- L'**Authentication** gère les comptes et les identifiants
- **Firestore** est la base de données NoSQL qui stocke les données supplémentaires

## Causes probables

1. **Règles de sécurité Firestore trop restrictives** (raison la plus courante)
2. Problèmes de connexion réseau lors de l'écriture dans Firestore
3. Erreur dans le code lors de l'appel à `setDoc`
4. Configuration incorrecte de Firestore

## Comment résoudre le problème

### 1. Vérifier les règles de sécurité Firestore

La cause la plus probable est que vos règles de sécurité Firestore ne permettent pas l'écriture, même pour les utilisateurs authentifiés.

#### Étapes à suivre :

1. Allez sur la [console Firebase](https://console.firebase.google.com/)
2. Sélectionnez votre projet
3. Dans le menu de gauche, cliquez sur "Firestore Database"
4. Cliquez sur l'onglet "Rules"
5. Remplacez les règles actuelles par ces règles temporaires pour le développement :

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null;
    }
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

6. Cliquez sur "Publish"

### 2. Vérifier les logs

J'ai modifié le code pour ajouter des logs plus détaillés qui vous aideront à identifier exactement où se produit l'erreur :

1. Essayez de créer un nouveau compte
2. Consultez les logs dans la console de développement
3. Recherchez des messages d'erreur concernant Firestore, notamment :
   - `ERREUR CRITIQUE lors de l'écriture dans Firestore`
   - `PROBLÈME DE PERMISSIONS FIRESTORE`

### 3. Vérifiez que Firestore est bien initialisé

Assurez-vous que Firestore a été correctement créé dans votre projet Firebase :

1. Dans la console Firebase, vérifiez que "Firestore Database" est bien configurée
2. Si ce n'est pas le cas, créez-la en cliquant sur "Create Database"
3. Sélectionnez le mode "Start in test mode" pour commencer

## Important pour la production

Les règles de sécurité suggérées ci-dessus sont volontairement permissives pour faciliter le développement. Pour la production, vous devriez utiliser des règles plus strictes comme celles du fichier `firestore-rules.txt` :

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

Ces règles sont plus sécurisées car elles limitent l'accès de chaque utilisateur uniquement à ses propres données.
