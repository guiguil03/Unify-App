// k6 Test - getNearbyRunners avec logique métier complète
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Métriques custom
const errorRate = new Rate('errors');
const latencyTrend = new Trend('latency');

// Configuration du test
export const options = {
  stages: [
    { duration: '30s', target: 10 },  // Monter à 10 VUs en 30s
    { duration: '1m', target: 30 },   // Monter à 30 VUs en 1 min
    { duration: '2m', target: 30 },   // Maintenir 30 VUs pendant 2 min
    { duration: '30s', target: 0 },   // Descendre à 0 VUs en 30s
  ],
  thresholds: {
    // SLO: Latence p95 < 600ms pour getNearbyRunners (opération complexe)
    'http_req_duration': ['p(95)<600'],
    // SLO: Taux d'erreur < 5%
    'errors': ['rate<0.05'],
    'http_req_failed': ['rate<0.05'],
  },
};

// Configuration
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

const headers = {
  'Content-Type': 'application/json'
};

// Positions de test (quelques villes françaises)
const testLocations = [
  { name: 'Paris', lat: 48.8566, lon: 2.3522 },
  { name: 'Lyon', lat: 45.7640, lon: 4.8357 },
  { name: 'Marseille', lat: 43.2965, lon: 5.3698 },
  { name: 'Toulouse', lat: 43.6047, lon: 1.4442 },
  { name: 'Nice', lat: 43.7102, lon: 7.2620 },
];

const testRadii = [5, 10, 20]; // Rayons de recherche en km

export default function () {
  // Choisir une position et un rayon aléatoirement
  const location = testLocations[Math.floor(Math.random() * testLocations.length)];
  const radius = testRadii[Math.floor(Math.random() * testRadii.length)];
  
  // Appel à getNearbyRunners avec logique métier complète
  const res = http.get(
    `${BASE_URL}/api/nearby-runners?lat=${location.lat}&lon=${location.lon}&radius=${radius}`,
    { headers }
  );
  
  check(res, {
    'getNearbyRunners - status 200': (r) => r.status === 200,
    'getNearbyRunners - latency < 600ms': (r) => r.timings.duration < 600,
    'getNearbyRunners - has runners array': (r) => {
      try {
        const body = JSON.parse(r.body);
        return Array.isArray(body.runners);
      } catch (e) {
        return false;
      }
    },
    'getNearbyRunners - includes distance calculations': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.runners.length === 0 || body.runners[0].distance !== undefined;
      } catch (e) {
        return false;
      }
    },
  });
  
  errorRate.add(res.status >= 500);
  latencyTrend.add(res.timings.duration);
  
  // Log quelques infos sur les résultats
  try {
    const body = JSON.parse(res.body);
    if (body.count > 0) {
      console.log(`Found ${body.count} runners within ${radius}km of ${location.name}`);
    }
  } catch (e) {
    // Ignorer les erreurs de parsing
  }
  
  sleep(1);
}

// Fonction pour afficher un résumé à la fin
export function handleSummary(data) {
  const p95 = data.metrics['http_req_duration'].values['p(95)'];
  const errorRateValue = data.metrics['errors'].values.rate * 100;
  
  console.log('\n' + '='.repeat(80));
  console.log('📊 RÉSUMÉ DU TEST getNearbyRunners');
  console.log('='.repeat(80));
  console.log(`✅ Requêtes totales: ${data.metrics['http_reqs'].values.count}`);
  console.log(`✅ Requêtes/sec: ${data.metrics['http_reqs'].values.rate.toFixed(2)}`);
  console.log(`✅ Latence p95: ${p95.toFixed(2)}ms (seuil: 600ms) ${p95 < 600 ? '✅' : '❌'}`);
  console.log(`✅ Taux d'erreur: ${errorRateValue.toFixed(2)}% (seuil: 5%) ${errorRateValue < 5 ? '✅' : '❌'}`);
  console.log('='.repeat(80) + '\n');
  
  return {
    'stdout': JSON.stringify(data, null, 2),
    'results/nearby-runners-summary.json': JSON.stringify(data, null, 2),
  };
}

