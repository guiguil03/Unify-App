# Architecture du Microservice d'Affiliation

## Vue d'ensemble

Ce microservice suit l'**architecture Clean (Clean Architecture)** de Robert C. Martin, qui sépare les préoccupations en couches concentriques avec des dépendances unidirectionnelles.

```
┌─────────────────────────────────────────────────────────────┐
│                      External World                          │
│                   (HTTP, Database, etc.)                     │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│              Application Layer (API)                         │
│  - Controllers (AffiliationController)                       │
│  - DTOs (CreateCodeDto, ValidateCodeDto)                    │
│  - HTTP/REST interface                                       │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                  Domain Layer (Métier)                       │
│                                                              │
│  Use Cases:                                                  │
│  - CreateAffiliationCodeUseCase                             │
│  - ValidateAffiliationCodeUseCase                           │
│  - GetAffiliationCodeUseCase                                │
│                                                              │
│  Services:                                                   │
│  - CodeGeneratorService                                      │
│                                                              │
│  Entities:                                                   │
│  - Affiliation                                               │
│  - AffiliationUsage                                          │
│                                                              │
│  Ports (Interfaces):                                         │
│  - IAffiliationRepository                                    │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│            Infrastructure Layer                              │
│  - SupabaseAffiliationRepository (implements port)          │
│  - SupabaseService (DB client)                              │
│  - Database schema & migrations                              │
└─────────────────────────────────────────────────────────────┘
```

## Principe de dépendance

Les flèches de dépendance pointent **vers l'intérieur** :

```
Infrastructure → Domain ← Application
```

- **Application** dépend de **Domain** (use cases)
- **Infrastructure** dépend de **Domain** (ports/interfaces)
- **Domain** ne dépend de rien (pure logique métier)

## Flux de requête

### Exemple : Création d'un code d'affiliation

```
1. Client HTTP
   │
   └──> POST /api/affiliation/create { userId: "..." }
        │
2. Application Layer
   │
   └──> AffiliationController.createCode()
        │
        └──> CreateCodeDto (validation)
             │
3. Domain Layer
   │
   └──> CreateAffiliationCodeUseCase.execute(userId)
        │
        ├──> IAffiliationRepository.findByUserId() [Port]
        │    │
        │    └──> [Infrastructure implémente]
        │
        ├──> CodeGeneratorService.generate()
        │
        └──> IAffiliationRepository.create() [Port]
             │
4. Infrastructure Layer
   │
   └──> SupabaseAffiliationRepository.create()
        │
        └──> Supabase Client → PostgreSQL
```

## Responsabilités par couche

### Domain (Cœur métier)

**Responsabilités :**
- Définir les règles métier
- Définir les entités (Affiliation, AffiliationUsage)
- Orchestrer la logique dans les use cases
- Définir les contrats (ports/interfaces)

**Ce qu'elle NE fait PAS :**
- Communiquer avec la base de données
- Gérer les requêtes HTTP
- Dépendre de frameworks

**Fichiers :**
- `domain/models/*.entity.ts`
- `domain/services/*.service.ts`
- `domain/ports/*.interface.ts`
- `domain/usecases/*.usecase.ts`

### Infrastructure (Implémentations techniques)

**Responsabilités :**
- Implémenter les ports définis par le domaine
- Communiquer avec Supabase
- Mapper les données DB ↔ Entités domaine

**Ce qu'elle NE fait PAS :**
- Contenir de la logique métier
- Exposer des APIs publiques

**Fichiers :**
- `infrastructure/db/supabase.client.ts`
- `infrastructure/db/affiliation.repository.ts`

### Application (Interface utilisateur)

**Responsabilités :**
- Exposer l'API REST
- Valider les entrées (DTOs)
- Transformer les entités en réponses HTTP
- Gérer les erreurs HTTP

**Ce qu'elle NE fait PAS :**
- Contenir de la logique métier
- Accéder directement à la base de données

**Fichiers :**
- `application/api/affiliation.controller.ts`
- `application/api/dto/*.dto.ts`

## Règles métier implémentées

### 1. Création de code

```typescript
// UseCase: CreateAffiliationCodeUseCase

Règles :
1. Un utilisateur ne peut avoir qu'UN seul code
2. Le code doit être unique (8 caractères alphanumériques)
3. Alphabet sans caractères ambigus (pas de 0, O, I, l)
```

### 2. Validation de code

```typescript
// UseCase: ValidateAffiliationCodeUseCase

Règles :
1. Le format du code doit être valide
2. Le code doit exister en base
3. Un utilisateur ne peut pas s'auto-affilier
4. Un utilisateur ne peut utiliser un code qu'une seule fois
5. Chaque utilisation est enregistrée
```

## Avantages de cette architecture

### 1. Testabilité
- Les use cases peuvent être testés sans base de données
- On peut mocker les repositories (interfaces)

```typescript
const mockRepo: IAffiliationRepository = {
  findByUserId: jest.fn(),
  create: jest.fn(),
  // ...
};

const useCase = new CreateAffiliationCodeUseCase(mockRepo, codeGenerator);
```

### 2. Maintenabilité
- Chaque couche a une responsabilité claire
- Facile de trouver où est la logique

### 3. Évolutivité
- Changement de DB ? → Remplacer Infrastructure
- Changement d'API (GraphQL) ? → Remplacer Application
- Le domaine reste inchangé !

### 4. Indépendance
- Le métier ne dépend pas de NestJS
- On pourrait remplacer NestJS par Express sans toucher au domaine

## Pattern : Dependency Inversion

Le domaine définit les **interfaces** (ports), l'infrastructure les **implémente**.

```typescript
// Domain définit le contrat
export interface IAffiliationRepository {
  create(userId: string, code: string): Promise<Affiliation>;
}

// Infrastructure implémente
export class SupabaseAffiliationRepository implements IAffiliationRepository {
  async create(userId: string, code: string): Promise<Affiliation> {
    // Implémentation Supabase
  }
}

// NestJS injecte l'implémentation
@Module({
  providers: [
    {
      provide: AFFILIATION_REPOSITORY,
      useClass: SupabaseAffiliationRepository,
    },
  ],
})
```

## Modules NestJS

```
AppModule
  └── ApplicationModule
       └── DomainModule
            └── InfrastructureModule
```

Chaque couche a son propre module pour une séparation claire.

## Conventions de nommage

- **Entités** : `*.entity.ts` (Affiliation, AffiliationUsage)
- **Interfaces** : `*.interface.ts` (IAffiliationRepository)
- **Use Cases** : `*.usecase.ts` (CreateAffiliationCodeUseCase)
- **Services** : `*.service.ts` (CodeGeneratorService)
- **DTOs** : `*.dto.ts` (CreateCodeDto)
- **Controllers** : `*.controller.ts` (AffiliationController)

## Exemple de modification

### Scénario : Ajouter un système de récompenses

1. **Domain** : Créer `RewardUseCase`
2. **Domain** : Définir `IRewardRepository` interface
3. **Infrastructure** : Créer `SupabaseRewardRepository`
4. **Application** : Créer `RewardController`

Le reste du code n'est **pas affecté** ! C'est ça, la Clean Architecture.
