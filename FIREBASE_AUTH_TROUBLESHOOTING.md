# Guide de dépannage pour l'authentification Firebase dans Unify

## Problème actuel : La connexion/inscription ne fonctionne pas

Si vous rencontrez des problèmes avec l'authentification Firebase dans l'application Unify, voici un guide étape par étape pour résoudre ces problèmes.

## 1. Vérification de la configuration Firebase

### Configuration Firebase incorrecte

La première chose à vérifier est que le fichier `src/config/firebase.ts` contient les bonnes informations de configuration pour votre projet Firebase.

✅ **Solution** : Vérifiez que les informations de configuration correspondent exactement à celles de votre projet Firebase dans la console Firebase.

### Vérification de l'initialisation Firebase

Pour vérifier si Firebase est correctement initialisé, nous avons ajouté des logs de diagnostic au démarrage de l'application. Consultez la console pour voir ces logs.

## 2. Activation des méthodes d'authentification

Si la configuration est correcte mais que l'authentification ne fonctionne toujours pas, vérifiez que vous avez activé l'authentification par email/mot de passe dans Firebase.

### Étapes pour activer l'authentification par email/mot de passe :

1. Accédez à la [Console Firebase](https://console.firebase.google.com/)
2. Sélectionnez votre projet
3. Dans le menu de gauche, cliquez sur "Authentication"
4. Cliquez sur l'onglet "Sign-in method"
5. Trouvez "Email/Password" dans la liste et cliquez dessus
6. Activez l'option "Email/Password"
7. Cliquez sur "Save"

## 3. Vérification des logs d'erreur

Nous avons ajouté des logs détaillés pour vous aider à diagnostiquer les problèmes d'authentification. Vérifiez les logs dans la console de développement pour voir les erreurs spécifiques.

### Erreurs courantes et leur signification :

- `auth/invalid-email` : Format d'email invalide
- `auth/user-disabled` : Compte utilisateur désactivé
- `auth/user-not-found` ou `auth/wrong-password` : Email ou mot de passe incorrect
- `auth/email-already-in-use` : Email déjà utilisé pour un autre compte
- `auth/weak-password` : Mot de passe trop faible (minimum 6 caractères)
- `auth/operation-not-allowed` : Méthode d'authentification non activée dans Firebase
- `auth/network-request-failed` : Problème de connexion réseau
- `auth/internal-error` : Erreur interne Firebase

## 4. Vérification des règles de sécurité Firestore

Si vous pouvez vous connecter mais que les données utilisateur ne sont pas enregistrées dans Firestore, le problème est probablement lié aux règles de sécurité Firestore.

### Règles de sécurité temporaires pour le développement :

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

### Étapes pour mettre à jour les règles de sécurité :

1. Accédez à la [Console Firebase](https://console.firebase.google.com/)
2. Sélectionnez votre projet
3. Dans le menu de gauche, cliquez sur "Firestore Database"
4. Cliquez sur l'onglet "Rules"
5. Remplacez les règles existantes par les règles temporaires ci-dessus
6. Cliquez sur "Publish"

## 5. Utilisation de l'outil de diagnostic Firebase

Nous avons créé un outil de diagnostic pour vous aider à identifier les problèmes avec Firebase. Pour l'utiliser, ouvrez la console de développement et tapez :

```javascript
// Cette commande vérifiera l'état de Firebase et affichera les résultats dans la console
diagnoseFirebase();
```

Cet outil vérifiera :
- Si Firebase Auth est correctement initialisé
- Si vous êtes actuellement connecté
- Si Firestore est correctement initialisé
- Si vous pouvez accéder à la collection "users" dans Firestore

## 6. Redémarrer l'application

Parfois, un simple redémarrage de l'application peut résoudre les problèmes d'initialisation de Firebase.

## 7. Derniers recours

Si aucune des solutions ci-dessus ne fonctionne, essayez ces options :

1. **Vérifiez votre connexion Internet** : Firebase nécessite une connexion Internet stable
2. **Effacez les données de l'application** : Des données locales corrompues peuvent causer des problèmes
3. **Vérifiez les restrictions CORS** : Si vous utilisez un VPN ou un proxy, cela peut bloquer les requêtes Firebase
4. **Contactez le support Firebase** : Si rien d'autre ne fonctionne, le problème peut être du côté de Firebase

## Utilisation en mode développement vs production

N'oubliez pas de mettre à jour les règles de sécurité Firestore avant de passer en production. Les règles suggérées pour le développement sont intentionnellement permissives et ne conviennent pas à un environnement de production.

## Ressources supplémentaires

- [Documentation Firebase Authentication](https://firebase.google.com/docs/auth)
- [Documentation Firestore](https://firebase.google.com/docs/firestore)
- [Règles de sécurité Firestore](https://firebase.google.com/docs/firestore/security/get-started)
