# Microservice d'Affiliation

Microservice NestJS pour gérer les codes d'affiliation avec architecture Clean.

## Architecture

Le projet suit une **architecture Clean** en couches :

```
src/
├── domain/              # Couche métier (règles business)
│   ├── models/         # Entités métier
│   ├── services/       # Services métier purs
│   ├── ports/          # Interfaces (contrats abstraits)
│   └── usecases/       # Cas d'usage métier
├── infrastructure/     # Couche infrastructure (implémentations concrètes)
│   └── db/            # Repository Supabase
├── application/        # Couche application (API)
│   └── api/           # Controllers REST
├── lib/               # Utilitaires
└── config/            # Configuration
```

### Principes de l'architecture Clean

- **Indépendance des frameworks** : Le métier ne dépend pas de NestJS
- **Testabilité** : Les use cases sont testables sans infrastructure
- **Indépendance de la DB** : Le domaine ne connaît pas Supabase
- **Règles métier isolées** : Toute la logique est dans le domaine

## Fonctionnalités

### 1. Création de code d'affiliation

Génère un code unique de 8 caractères pour un utilisateur.

**Règles métier :**
- Un utilisateur ne peut avoir qu'un seul code
- Le code doit être unique
- Format : 8 caractères (alphabet sans caractères ambigus)

### 2. Validation de code

Vérifie et enregistre l'utilisation d'un code lors de l'inscription.

**Règles métier :**
- Le code doit exister
- Un utilisateur ne peut pas utiliser son propre code
- Un utilisateur ne peut utiliser un code qu'une seule fois

### 3. Récupération de code

Permet de récupérer le code d'un utilisateur.

## Installation

```bash
cd micro-affil
npm install
```

## Configuration

1. Copiez le fichier `.env.example` vers `.env` :

```bash
cp .env.example .env
```

2. Remplissez les variables d'environnement :

```env
PORT=3001
NODE_ENV=development

SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_role_key
```

## Base de données

Exécutez le script SQL dans Supabase :

```bash
psql -h <supabase-host> -U postgres -d postgres < database/schema.sql
```

Ou copiez le contenu de `database/schema.sql` dans l'éditeur SQL de Supabase.

## Démarrage

### Mode développement

```bash
npm run start:dev
```

### Mode production

```bash
npm run build
npm start
```

## API Endpoints

### POST /api/affiliation/create

Créer un code d'affiliation pour un utilisateur.

**Request:**
```json
{
  "userId": "uuid-here"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "code": "ABC12345",
    "createdAt": "2025-01-01T00:00:00.000Z",
    "usedCount": 0
  }
}
```

### POST /api/affiliation/validate

Valider un code d'affiliation lors de l'inscription.

**Request:**
```json
{
  "code": "ABC12345",
  "userId": "uuid-of-new-user"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "affiliationId": "uuid",
    "affiliatorUserId": "uuid",
    "usage": {
      "id": "uuid",
      "affiliationId": "uuid",
      "usedByUserId": "uuid",
      "usedAt": "2025-01-01T00:00:00.000Z"
    }
  }
}
```

### GET /api/affiliation/:userId

Récupérer le code d'affiliation d'un utilisateur.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "code": "ABC12345",
    "createdAt": "2025-01-01T00:00:00.000Z",
    "usedCount": 5
  }
}
```

## Structure des données

### Table `affiliations`

| Colonne | Type | Description |
|---------|------|-------------|
| id | UUID | Identifiant unique |
| user_id | UUID | ID de l'utilisateur propriétaire |
| code | VARCHAR(8) | Code d'affiliation unique |
| created_at | TIMESTAMP | Date de création |
| used_count | INTEGER | Nombre d'utilisations |

### Table `affiliation_usages`

| Colonne | Type | Description |
|---------|------|-------------|
| id | UUID | Identifiant unique |
| affiliation_id | UUID | Référence vers le code |
| used_by_user_id | UUID | ID de l'utilisateur qui a utilisé le code |
| used_at | TIMESTAMP | Date d'utilisation |

## Exemple d'intégration

### Lors de l'inscription d'un nouvel utilisateur

```typescript
// 1. L'utilisateur s'inscrit avec un code (optionnel)
const signupData = {
  email: "user@example.com",
  password: "password",
  affiliationCode: "ABC12345" // optionnel
};

// 2. Après création du compte, valider le code
if (signupData.affiliationCode) {
  const response = await fetch('http://localhost:3001/api/affiliation/validate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      code: signupData.affiliationCode,
      userId: newUser.id
    })
  });

  const result = await response.json();

  if (result.success) {
    // Le parrain est : result.data.affiliatorUserId
    // Vous pouvez maintenant récompenser le parrain
  }
}
```

### Génération d'un code pour un utilisateur

```typescript
const response = await fetch('http://localhost:3001/api/affiliation/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: currentUser.id
  })
});

const result = await response.json();
const myCode = result.data.code; // ex: "ABC12345"
```

## Tests

```bash
npm test
```

## Déploiement

Le microservice peut être déployé sur :
- Heroku
- Railway
- Fly.io
- Docker

Exemple avec Docker :

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
CMD ["node", "dist/main.js"]
```

## Technologies

- **NestJS** : Framework backend
- **TypeScript** : Langage
- **Supabase** : Base de données PostgreSQL
- **nanoid** : Génération de codes uniques
- **class-validator** : Validation des DTOs

## Licence

MIT
