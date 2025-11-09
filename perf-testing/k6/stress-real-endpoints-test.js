// k6 Stress Test - Endpoints réels avec logique métier
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

// Positions de test
const testLocations = [
  { name: 'Paris', lat: 48.8566, lon: 2.3522 },
  { name: 'Lyon', lat: 45.7640, lon: 4.8357 },
  { name: 'Marseille', lat: 43.2965, lon: 5.3698 },
];

export const options = {
  stages: [
    { duration: '2m', target: 50 },   // Monter à 50 VUs
    { duration: '3m', target: 100 },  // Monter à 100 VUs
    { duration: '3m', target: 150 },  // Monter à 150 VUs
    { duration: '2m', target: 200 },  // Monter à 200 VUs (stress!)
    { duration: '3m', target: 200 },  // Maintenir 200 VUs
    { duration: '2m', target: 0 },    // Descendre à 0
  ],
  thresholds: {
    'http_req_duration': ['p(95)<1000'], // Seuil plus permissif en stress
    'errors': ['rate<0.10'],             // Jusqu'à 10% d'erreurs acceptables
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const headers = { 'Content-Type': 'application/json' };

export default function () {
  // Test 1: getNearbyRunners (logique métier lourde)
  const location = testLocations[Math.floor(Math.random() * testLocations.length)];
  const radius = 5 + Math.floor(Math.random() * 15); // 5-20km
  
  const res1 = http.get(
    `${BASE_URL}/api/nearby-runners?lat=${location.lat}&lon=${location.lon}&radius=${radius}`,
    { headers }
  );
  
  check(res1, {
    'nearby-runners status OK': (r) => r.status === 200 || r.status === 429, // Rate limiting OK
  });
  
  errorRate.add(res1.status >= 500);
  sleep(0.5);
  
  // Test 2: getContacts (logique métier avec symétrie)
  // Pour ce test, on utilise un userId aléatoire (idéalement depuis une liste)
  const testUserId = __ENV.TEST_USER_ID || 'test-user-id';
  
  const res2 = http.get(
    `${BASE_URL}/api/contacts?userId=${testUserId}`,
    { headers }
  );
  
  check(res2, {
    'contacts status OK': (r) => r.status === 200 || r.status === 400 || r.status === 429,
  });
  
  errorRate.add(res2.status >= 500);
  sleep(0.5);
}

export function handleSummary(data) {
  const p95 = data.metrics['http_req_duration'].values['p(95)'];
  const errorRateValue = data.metrics['errors'].values.rate * 100;
  
  console.log('\n' + '='.repeat(80));
  console.log('📊 RÉSUMÉ DU TEST DE STRESS - ENDPOINTS RÉELS');
  console.log('='.repeat(80));
  console.log(`✅ Requêtes totales: ${data.metrics['http_reqs'].values.count}`);
  console.log(`✅ Requêtes/sec: ${data.metrics['http_reqs'].values.rate.toFixed(2)}`);
  console.log(`✅ Latence p95: ${p95.toFixed(2)}ms (seuil: 1000ms) ${p95 < 1000 ? '✅' : '❌'}`);
  console.log(`✅ Taux d'erreur: ${errorRateValue.toFixed(2)}% (seuil: 10%) ${errorRateValue < 10 ? '✅' : '❌'}`);
  console.log('='.repeat(80) + '\n');
  
  return {
    'stdout': JSON.stringify(data, null, 2),
    'results/stress-real-endpoints-summary.json': JSON.stringify(data, null, 2),
  };
}

