# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Unify is a social running platform — a React Native / Expo mobile app (iOS, Android, Web) backed by Supabase. A separate NestJS microservice (`micro-affil/`) handles the affiliation/referral system with Clean Architecture.

---

## Commands

### Mobile App (root)

```bash
expo start              # Start Expo dev server (scan QR or press i/a)
expo run:ios            # Run on iOS simulator
expo run:android        # Run on Android emulator
npm run web             # Run in browser via react-native-web
npm test                # Run Jest tests
npm run lint            # ESLint
npm run format          # Prettier

# EAS builds
eas build --platform ios --profile preview
eas build --platform android --profile preview
```

### Microservice (micro-affil/)

```bash
cd micro-affil
npm run start:dev       # Dev server with hot reload (ts-node-dev)
npm run build           # Compile TypeScript to dist/
npm start               # Run compiled output
npm test                # Jest tests
npm run test:cov        # Coverage report
npm run lint            # ESLint
```

---

## Architecture

### Mobile App (`src/`)

```
src/
├── App.tsx                  # Root: providers, navigation, custom header
├── types/navigation.ts      # RootStackParamList — all route param types
├── contexts/                # AuthContext, SubscriptionContext
├── screens/                 # 30+ full-page screens
├── components/              # Reusable UI (common/, map/, posts/, etc.)
├── services/                # Supabase data access (one file per domain)
├── hooks/                   # Custom hooks that wrap services
├── types/                   # TypeScript interfaces per domain entity
├── utils/                   # Formatting, validation, map math, etc.
└── config/supabase.ts       # Supabase client with SecureStore adapter
```

**Data flow:** Screen → Hook (e.g. `useActivities`) → Service (e.g. `ActivitiesService`) → Supabase.

**Navigation:** Single `createNativeStackNavigator` with two logical stacks:
- `AuthStack` — Welcome, Login, ResetPassword (unauthenticated)
- `AppStack` — all app screens (authenticated or "skipped")

`NavigationSwitcher` renders the correct stack based on `useAuth()`. `OnboardingChecker` auto-redirects to Onboarding when needed.

**Custom header (`AppHeader`):** All screens use a 100% React Native header (not native) to avoid iOS artifacts. Main screens show a Settings icon (left) + Messages icon (right); detail screens show a back button.

**Auth (`AuthContext`):**
- Session cached locally with `expo-secure-store`; `getSession()` is non-blocking on cold start
- 30-day inactivity timeout triggers auto-signout
- `isSkipped` allows guest browsing without an account

**Premium (`SubscriptionContext`):** Gates premium-only features throughout the app.

### Microservice (`micro-affil/`)

Clean Architecture with strict inward dependency flow:

```
Application (REST controllers, DTOs)
    ↓
Domain (use cases, entities, repository interfaces)
    ↓
Infrastructure (SupabaseAffiliationRepository)
```

Key rule: **Domain never imports from Application or Infrastructure.** Use cases depend only on the `IAffiliationRepository` port — not on Supabase directly.

---

## Key Patterns & Conventions

- **Styling:** `StyleSheet.create()` only; primary brand color `#7D80F4`.
- **Icons:** `MaterialCommunityIcons` from `@expo/vector-icons`.
- **Toasts:** `react-native-toast-message` — use `Toast.show({ type: 'success'|'error'|'info', ... })`.
- **Screen code-split:** Screens import from hooks, not services directly.
- **Services are stateless:** They export async functions or static class methods. State lives in hooks/contexts.
- **Map utilities:** Clustering, distance, and region helpers live in `src/utils/map/`.
- **French UI strings:** The app UI is in French (screen titles, error messages, comments).

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Mobile | React Native 0.81, Expo SDK 54, New Architecture enabled |
| Language | TypeScript 5 (strict mode) |
| Navigation | React Navigation v6 (native-stack) |
| Backend-as-a-Service | Supabase (Postgres, Realtime, Storage, Auth) |
| Maps | react-native-maps |
| Animations | react-native-reanimated |
| Microservice | NestJS 10, Clean Architecture |
| Builds | EAS (Expo Application Services) |
