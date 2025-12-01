# 🚀 Environnement de Tests de Performance - Unify App

## 📋 Table des matières
1. [Vue d'ensemble](#vue-densemble)
2. [Prérequis](#prérequis)
3. [Installation](#installation)
4. [Versions & Reproductibilité](#versions--reproductibilité)
5. [Données de test](#données-de-test)
6. [Lancement de l'environnement](#lancement-de-lenvironnement)
7. [Exécution des tests](#exécution-des-tests)
8. [Analyse des résultats](#analyse-des-résultats)

---

## 🎯 Vue d'ensemble

Environnement complet pour tester les performances de l'API Unify avec :
- **Prometheus** : Collecte de métriques
- **Grafana** : Visualisation des métriques
- **k6** : Tests de charge
- **Seed de données** : Environnement reproductible

---

## 📦 Prérequis

- **Docker** et **Docker Compose** installés
- **Node.js** 16+ 
- **Git**
- Accès à Supabase (URL + API Key)

---

## 🔧 Installation

```bash
# Installer les dépendances k6
cd perf-testing
npm install

# OU installer k6 globalement (Windows)
choco install k6

# Linux/Mac
brew install k6
```

---

## 📌 Versions & Reproductibilité

### Tags Git

**Version baseline (avant optimisations) :**
```bash
git tag perf-baseline 3beac72
git push origin perf-baseline
```

**Version après optimisations :**
```bash
# Après avoir fait vos optimisations
git tag perf-after <commit-hash>
git push origin perf-after
```

### Basculer entre versions

```bash
# Tester la baseline
git checkout perf-baseline
npm run perf:baseline

# Tester après optimisations
git checkout perf-after
npm run perf:after

# Comparer les résultats
npm run perf:compare
```

---

## 🗄️ Données de test

### Seed automatique

Le script `seed-database.js` crée un jeu de données reproductible :

- **100 utilisateurs** avec positions géographiques (Paris, Lyon, Marseille, etc.)
- **300 activités** de course à pied avec statistiques
- **50 runners actifs** sur la carte
- **200 relations/contacts** entre utilisateurs

### Lancer le seed

```bash
npm run seed
```

### Variables du seed

Modifiez `seed-config.json` pour ajuster :
- Nombre d'utilisateurs
- Zones géographiques
- Densité d'activités

---

## 🐳 Lancement de l'environnement

### Configuration des variables

Copiez et éditez `.env.perf` :

```bash
cp .env.perf.example .env.perf
```

Variables requises :
```env
SUPABASE_URL=https://muhexuopzmqdxonurktn.supabase.co
SUPABASE_API_KEY=votre_clé_api
SUPABASE_SERVICE_KEY=votre_service_key
APP_PORT=3000
PROMETHEUS_PORT=9090
GRAFANA_PORT=3001
```

### Démarrer tout l'environnement

```bash
# Démarrer Prometheus + Grafana + Exporteur de métriques
npm run perf:start

# OU avec Docker Compose directement
docker-compose up -d
```

### Services disponibles

| Service | URL | Credentials |
|---------|-----|-------------|
| **App Metrics** | http://localhost:3000/metrics | - |
| **Prometheus** | http://localhost:9090 | - |
| **Grafana** | http://localhost:3001 | admin / admin |

---

## 🧪 Exécution des tests

### Test de charge complet

```bash
# Test de charge standard (50 VUs pendant 2 minutes)
npm run test:load

# Test de stress (augmentation progressive jusqu'à 200 VUs)
npm run test:stress

# Test de spike (pics soudains de trafic)
npm run test:spike

# Test d'endurance (charge stable pendant 30 minutes)
npm run test:soak
```

### Test d'un endpoint spécifique

```bash
# Tester getNearbyRunners
npm run test:nearby-runners

# Tester getActivities
npm run test:activities

# Tester les messages
npm run test:messages
```

### Tests avec seuils SLO

```bash
# Exécuter les tests avec validation des SLOs
npm run test:slo
```

---

## 📊 Analyse des résultats

### Métriques collectées

**SLI Latence :**
- p50 (médiane)
- p95 (95e percentile) ← **Utilisé pour SLO**
- p99 (99e percentile)

**SLI Erreurs :**
- Taux d'erreurs 4xx (client)
- Taux d'erreurs 5xx (serveur) ← **Utilisé pour SLO**

**Autres métriques :**
- Throughput (requêtes/seconde)
- Temps de réponse moyen
- Nombre de connexions actives

### Consulter les résultats

#### 1. Dans le terminal (k6)

Les résultats s'affichent automatiquement après chaque test :

```
✓ status is 200
✓ latency is below 600ms
✓ error rate is below 5%

checks.........................: 100.00% ✓ 15000  ✗ 0
http_req_duration..............: avg=185ms p95=350ms
http_reqs......................: 5000    83.33/s
```

#### 2. Dans Grafana

1. Ouvrir http://localhost:3001
2. Login: `admin` / `admin`
3. Dashboard **"Unify Performance"** préconfiguré avec :
   - Graphiques de latence
   - Taux d'erreur
   - Débit (throughput)
   - Comparaison baseline vs after

#### 3. Dans Prometheus

1. Ouvrir http://localhost:9090
2. Requêtes PromQL utiles :

```promql
# Latence p95 par endpoint
histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le, endpoint))

# Taux d'erreur 5xx
sum(rate(http_requests_total{status_code=~"5.."}[5m])) / sum(rate(http_requests_total[5m]))

# Nombre de requêtes par seconde
rate(http_requests_total[1m])
```

### Exporter les résultats

```bash
# Exporter en JSON
npm run test:load -- --out json=results/baseline.json

# Exporter en CSV
npm run test:load -- --out csv=results/baseline.csv

# Exporter vers InfluxDB
npm run test:load -- --out influxdb=http://localhost:8086/k6
```

---

## 📈 Tableau SLO de référence

| Endpoint | Seuil Latence p95 | Seuil Erreurs 5xx |
|----------|-------------------|-------------------|
| `GET /api/users` | 300ms | < 3% |
| `GET /api/runners` | 300ms | < 3% |
| `getNearbyRunners` | 600ms | < 5% |
| `GET /api/activities` | 400ms | < 3% |
| `GET /api/messages` | 400ms | < 3% |

---

## 🔄 Infrastructure

### Configuration locale

- **CPU** : 4 cores recommandés
- **RAM** : 8GB minimum
- **Instances** : 1 (mode développement)
- **Pool DB** : Supabase géré (pooling automatique)

### Configuration staging

```yaml
# staging-config.yml
app:
  instances: 2
  cpu: 2
  memory: 4GB

database:
  pool_size: 20
  max_connections: 100

load_balancer:
  enabled: true
  algorithm: round-robin
```

---

## 🚀 Commandes rapides

```bash
# Setup complet
npm run setup

# Seed + Tests complets
npm run perf:full

# Nettoyer l'environnement
npm run perf:clean

# Voir les logs Prometheus
docker-compose logs -f prometheus

# Voir les logs Grafana
docker-compose logs -f grafana

# Arrêter tout
npm run perf:stop
```

---

## 📝 Notes importantes

1. **Seed avant chaque test** : Pour des résultats reproductibles
2. **Même infrastructure** : Utilisez toujours le même environnement
3. **Horaires** : Testez aux mêmes heures (éviter les heures de pointe de Supabase)
4. **Cache** : Videz les caches entre baseline et after
5. **Versions** : Documentez les versions de toutes les dépendances

---

## 🐛 Troubleshooting

### Prometheus ne démarre pas
```bash
docker-compose down -v
docker-compose up -d
```

### k6 n'exécute pas les tests
```bash
# Vérifier l'installation
k6 version

# Réinstaller si besoin
npm install -g k6
```

### Grafana ne se connecte pas à Prometheus
```bash
# Vérifier le réseau Docker
docker network ls
docker network inspect perf-testing_default
```

---

## 📚 Ressources

- [Documentation k6](https://k6.io/docs/)
- [Prometheus](https://prometheus.io/docs/)
- [Grafana](https://grafana.com/docs/)
- [Supabase Performance](https://supabase.com/docs/guides/platform/performance)

---

**Créé le** : 2025-11-07  
**Commit baseline** : 3beac72  
**Auteur** : Équipe Unify

