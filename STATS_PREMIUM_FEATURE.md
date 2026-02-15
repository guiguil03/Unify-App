# 📊 Statistiques Avancées - Fonctionnalité Premium

## ✅ Ce qui a été implémenté

### 1. Service de Statistiques (`StatsService.ts`)

Calcule automatiquement :
- **Distance totale** parcourue
- **Temps total** d'activité
- **Nombre d'activités**
- **Allure moyenne** (min/km)
- **Meilleure allure** (record personnel)
- **Plus longue course** (record de distance)
- **Série en cours** (jours consécutifs avec activité)
- **Stats par semaine** (8 dernières semaines)
- **Stats par mois** (6 derniers mois)
- **Comparaisons** cette semaine vs semaine dernière / ce mois vs mois dernier

### 2. Écran Statistiques (`StatsScreen.tsx`)

Interface avec :
- 📈 **Graphiques de progression**
  - Graphique en courbe : Distance par semaine (km)
  - Graphique en barres : Nombre d'activités par mois

- 📊 **Vue d'ensemble** (4 cartes)
  - Distance totale
  - Temps total
  - Nombre d'activités
  - Série de jours consécutifs 🔥

- 🆚 **Comparaisons**
  - Cette semaine vs semaine dernière (% de progression)
  - Ce mois vs mois dernier (% de progression)
  - Barres de progression colorées (vert = progrès, rouge = baisse)

- 🏆 **Records personnels**
  - Meilleure allure
  - Plus longue course
  - Allure moyenne

### 3. Accès réservé aux Premium

- ✅ **Vérification Premium** : Seuls les utilisateurs premium peuvent accéder
- 🔒 **Écran de verrouillage** : Les utilisateurs gratuits voient un écran "Passez à Premium" avec la liste des fonctionnalités

### 4. Navigation

- **Bouton d'accès** ajouté dans le **ProfileScreen**
- **Icône** : chart-line
- **Titre** : "Statistiques Avancées"
- **Sous-titre** : "Suivi détaillé de vos performances"

---

## 🎨 Design

### Graphiques
- Courbes lissées (Bezier curves)
- Couleur principale : #7D80F4 (violet de l'app)
- Fond blanc avec ombres légères
- Labels clairs et lisibles

### Cartes statistiques
- Fond blanc
- Bordure arrondie (12px)
- Ombres subtiles
- Icônes colorées (MaterialCommunityIcons)

### Barres de progression
- **Vert** (#4CAF50) : Progression positive
- **Rouge** (#F44336) : Baisse
- Pourcentage affiché en dessous

---

## 📱 Comment y accéder (utilisateur)

### Utilisateur Premium :
1. Va dans l'onglet **"Profil"** (BottomNav)
2. Clique sur **"Statistiques Avancées"** (après les stats de base)
3. Découvre toutes les statistiques avancées ! 🎉

### Utilisateur Gratuit :
1. Va dans l'onglet **"Profil"**
2. Clique sur **"Statistiques Avancées"**
3. Voit l'écran **"Fonctionnalité Premium"** avec :
   - Icône couronne 👑
   - Liste des fonctionnalités premium
   - Incitation à s'abonner

---

## 🔢 Calculs détaillés

### Série (Streak)
- Compte les **jours consécutifs** où l'utilisateur a fait au moins une activité
- Inclut aujourd'hui et hier
- Se réinitialise si un jour est manqué

### Stats par semaine
- 8 dernières semaines (du dimanche au samedi)
- Affiche : S47, S48, S49... (numéro de semaine)
- Distance totale, durée, nb d'activités, allure moyenne

### Stats par mois
- 6 derniers mois complets
- Affiche : Jan, Fév, Mar, Avr...
- Distance totale, durée, nb d'activités, allure moyenne

### Progression %
```
Progression = ((Cette période - Période précédente) / Période précédente) × 100
```

Exemples :
- 10 km cette semaine, 8 km semaine dernière = **+25%** 🟢
- 5 km cette semaine, 10 km semaine dernière = **-50%** 🔴

---

## 🚀 Pour tester

### 1. Lance l'app
```bash
npm start
```

### 2. Assure-toi d'avoir un compte Premium
- Va dans Profil → Voir l'abonnement actif
- Ou active Premium via la SubscriptionCard

### 3. Aie des activités dans la DB
- Va dans l'onglet **"Activités"**
- Crée quelques activités de test (différentes dates)
- Ou utilise les activités existantes

### 4. Ouvre les Stats
- Profil → "Statistiques Avancées"
- Explore les graphiques et stats !

---

## 📦 Packages installés

```json
{
  "react-native-chart-kit": "^6.x",
  "react-native-svg": "^13.x"
}
```

Ces packages permettent d'afficher des graphiques natifs performants.

---

## 🎯 Fonctionnalités futures (idées)

### Objectifs personnalisables
- Définir un objectif de distance/semaine
- Barre de progression vers l'objectif
- Notifications de rappel

### Comparaison sociale
- Comparer ses stats avec ses amis
- Classement hebdomadaire/mensuel

### Badges et récompenses
- Badge "10 km parcourus"
- Badge "Série de 7 jours"
- Badge "50 activités"

### Export des données
- Télécharger un rapport PDF
- Exporter en CSV
- Partager sur les réseaux sociaux

### Prévisions IA
- "À ce rythme, tu atteindras 100km ce mois !"
- Suggestions personnalisées

---

## 🔧 Fichiers modifiés/créés

### Créés
- ✅ `src/services/StatsService.ts` (432 lignes)
- ✅ `src/screens/StatsScreen.tsx` (511 lignes)

### Modifiés
- ✅ `src/App.tsx` (ajout import + route Stats)
- ✅ `src/types/navigation.ts` (ajout Stats: undefined)
- ✅ `src/screens/ProfileScreen.tsx` (ajout bouton + styles)
- ✅ `package.json` (nouvelles dépendances)

---

## 💡 Notes techniques

### Performance
- Les calculs sont faits **côté client** (pas de surcharge serveur)
- Les données sont **mises en cache** tant que l'écran est monté
- Pull-to-refresh pour actualiser

### Calculs optimisés
- Utilisation de `.reduce()` pour les sommes
- Filtrage efficace par date
- Pas de boucles imbriquées inutiles

### Gestion des cas limites
- **Aucune activité** : Affiche tous les stats à 0
- **Utilisateur non connecté** : Redirige vers login
- **Erreur de chargement** : Affiche un message clair

---

## ✅ Checklist de test

- [ ] Ouvrir Stats avec un compte Premium → Voir les graphiques
- [ ] Ouvrir Stats avec un compte Gratuit → Voir l'écran "Premium requis"
- [ ] Créer une activité → Voir les stats se mettre à jour
- [ ] Vérifier que la série (streak) fonctionne
- [ ] Vérifier les graphiques (par semaine/mois)
- [ ] Vérifier les comparaisons (progression %)
- [ ] Tester le pull-to-refresh
- [ ] Vérifier que le bouton dans Profil fonctionne

---

## 🎉 Résultat final

Tu as maintenant une **fonctionnalité premium complète** avec :
- ✅ Statistiques avancées et détaillées
- ✅ Graphiques visuels et interactifs
- ✅ Comparaisons et progressions
- ✅ Réservé aux utilisateurs premium
- ✅ Interface moderne et intuitive

**C'est un excellent argument de vente pour passer à Premium !** 💎
