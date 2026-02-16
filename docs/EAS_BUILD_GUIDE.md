# Guide de build avec EAS (Expo Application Services)

## 📋 Prérequis

1. Installer EAS CLI globalement :
   ```bash
   npm install -g eas-cli
   ```

2. Se connecter à votre compte Expo :
   ```bash
   eas login
   ```

3. Lier votre projet à EAS :
   ```bash
   eas build:configure
   ```

## 🏗️ Profils de build disponibles

### 1. Development (Développement)
Pour tester avec un client de développement :
```bash
eas build --profile development --platform ios
eas build --profile development --platform android
```

**Caractéristiques :**
- Client de développement inclus
- Distribution interne uniquement
- iOS : Build pour simulateur ou appareil réel
- Android : APK pour installation directe

### 2. Preview (Aperçu)
Pour tester avant la production :
```bash
eas build --profile preview --platform ios
eas build --profile preview --platform android
```

**Caractéristiques :**
- Distribution interne
- iOS : Build pour appareil réel uniquement
- Android : APK pour installation directe

### 3. Production (Production)
Pour publier sur les stores :
```bash
eas build --profile production --platform ios
eas build --profile production --platform android
```

**Caractéristiques :**
- Prêt pour publication
- iOS : Build pour App Store
- Android : APK ou AAB pour Google Play

## 🍎 Build iOS

### Première fois

1. **Configurer les certificats iOS** :
   ```bash
   eas build --profile production --platform ios
   ```
   EAS va automatiquement gérer les certificats et profils de provisioning.

2. **Ou configurer manuellement** :
   - Allez dans [Apple Developer Portal](https://developer.apple.com)
   - Créez un App ID avec le bundle identifier `com.unify.app`
   - Activez "Sign in with Apple" sur cet App ID
   - EAS créera automatiquement les certificats nécessaires

### Builds suivants

```bash
# Build de développement
eas build --profile development --platform ios

# Build de production
eas build --profile production --platform ios
```

## 🤖 Build Android

### Première fois

1. **Créer une clé de signature** (si vous n'en avez pas) :
   ```bash
   eas build --profile production --platform android
   ```
   EAS peut créer automatiquement une clé de signature.

2. **Ou utiliser votre propre keystore** :
   - Créez un keystore avec `keytool`
   - Téléchargez-le sur EAS avec `eas credentials`

### Builds suivants

```bash
# Build de développement
eas build --profile development --platform android

# Build de production
eas build --profile production --platform android
```

## 📱 Installation des builds

### iOS

1. Une fois le build terminé, EAS vous donnera un lien de téléchargement
2. Ouvrez le lien sur votre iPhone
3. Installez le profil de confiance si nécessaire
4. Installez l'application

### Android

1. Téléchargez l'APK depuis le lien fourni par EAS
2. Transférez-le sur votre appareil Android
3. Activez "Sources inconnues" dans les paramètres
4. Installez l'APK

## 🚀 Publication sur les stores

### App Store (iOS)

1. **Soumettre le build** :
   ```bash
   eas submit --platform ios
   ```

2. **Ou manuellement** :
   - Téléchargez le build depuis EAS
   - Uploadez-le dans App Store Connect
   - Soumettez pour révision

### Google Play (Android)

1. **Soumettre le build** :
   ```bash
   eas submit --platform android
   ```

2. **Ou manuellement** :
   - Téléchargez l'AAB depuis EAS
   - Uploadez-le dans Google Play Console
   - Publiez

## ⚙️ Configuration des variables d'environnement

Les variables d'environnement sont définies dans `eas.json` pour le profil production. Pour ajouter d'autres variables :

1. Créez un fichier `.env.production` (ne le commitez pas !)
2. Ou utilisez les secrets EAS :
   ```bash
   eas secret:create --scope project --name SUPABASE_URL --value "votre-url"
   eas secret:create --scope project --name SUPABASE_API_KEY --value "votre-key"
   ```

## 🔧 Commandes utiles

```bash
# Voir l'état des builds
eas build:list

# Voir les détails d'un build
eas build:view [BUILD_ID]

# Annuler un build
eas build:cancel [BUILD_ID]

# Voir les credentials
eas credentials

# Gérer les secrets
eas secret:list
```

## 📝 Notes importantes

1. **Premier build iOS** : Peut prendre 20-30 minutes (création des certificats)
2. **Builds suivants** : Généralement 10-15 minutes
3. **Quota EAS** : Le plan gratuit inclut un nombre limité de builds par mois
4. **Certificats** : EAS gère automatiquement les certificats iOS (expiration, renouvellement)

## 🐛 Dépannage

### Erreur : "No Apple Team ID"
- Vérifiez que vous avez un compte Apple Developer actif
- Ajoutez votre Team ID dans `eas.json` (déjà configuré : `4MTHCVHX8J`)

### Erreur : "Bundle identifier already exists"
- Vérifiez que le bundle identifier `com.unify.app` est disponible
- Ou changez-le dans `app.json` et `eas.json`

### Build échoue
- Vérifiez les logs : `eas build:view [BUILD_ID]`
- Vérifiez que toutes les dépendances sont installées
- Vérifiez que `app.json` est valide

## 📚 Ressources

- [Documentation EAS Build](https://docs.expo.dev/build/introduction/)
- [EAS Submit](https://docs.expo.dev/submit/introduction/)
- [EAS Credentials](https://docs.expo.dev/app-signing/managed-credentials/)

