// k6 Load Test - Test de charge standard
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
    { duration: '1m', target: 50 },   // Monter à 50 VUs en 1 min
    { duration: '2m', target: 50 },   // Maintenir 50 VUs pendant 2 min
    { duration: '30s', target: 0 },   // Descendre à 0 VUs en 30s
  ],
  thresholds: {
    // SLO: Latence p95 < 600ms
    'http_req_duration': ['p(95)<600'],
    // SLO: Taux d'erreur < 5%
    'errors': ['rate<0.05'],
    // Vérifier que 95% des requêtes réussissent
    'http_req_failed': ['rate<0.05'],
  },
};

// Configuration
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

const headers = {
  'Content-Type': 'application/json'
};

export default function () {
  // Simulation d'un utilisateur qui navigue dans l'app
  // Les requêtes passent par l'app-exporter pour générer des métriques Prometheus
  
  // 1. Récupérer les utilisateurs sur la carte (getNearbyRunners - étape 1)
  let res1 = http.get(
    `${BASE_URL}/api/users`,
    { headers }
  );
  
  check(res1, {
    'GET users - status 200': (r) => r.status === 200,
    'GET users - latency < 300ms': (r) => r.timings.duration < 300,
  });
  
  errorRate.add(res1.status >= 500);
  latencyTrend.add(res1.timings.duration);
  
  sleep(0.5);
  
  // 2. Récupérer les runners actifs (getNearbyRunners - étape 2)
  let res2 = http.get(
    `${BASE_URL}/api/runners`,
    { headers }
  );
  
  check(res2, {
    'GET runners - status 200': (r) => r.status === 200,
    'GET runners - latency < 300ms': (r) => r.timings.duration < 300,
  });
  
  errorRate.add(res2.status >= 500);
  latencyTrend.add(res2.timings.duration);
  
  sleep(1);
  
  // 3. Récupérer les activités
  let res3 = http.get(
    `${BASE_URL}/api/activities`,
    { headers }
  );
  
  check(res3, {
    'GET activities - status 200': (r) => r.status === 200,
    'GET activities - latency < 400ms': (r) => r.timings.duration < 400,
  });
  
  errorRate.add(res3.status >= 500);
  latencyTrend.add(res3.timings.duration);
  
  sleep(2);
}

// Fonction pour afficher un résumé à la fin
export function handleSummary(data) {
  const p95 = data.metrics['http_req_duration'].values['p(95)'];
  const errorRateValue = data.metrics['errors'].values.rate * 100;
  
  console.log('\n' + '='.repeat(80));
  console.log('📊 RÉSUMÉ DU TEST DE CHARGE');
  console.log('='.repeat(80));
  console.log(`✅ Requêtes totales: ${data.metrics['http_reqs'].values.count}`);
  console.log(`✅ Requêtes/sec: ${data.metrics['http_reqs'].values.rate.toFixed(2)}`);
  console.log(`✅ Latence p95: ${p95.toFixed(2)}ms (seuil: 600ms) ${p95 < 600 ? '✅' : '❌'}`);
  console.log(`✅ Taux d'erreur: ${errorRateValue.toFixed(2)}% (seuil: 5%) ${errorRateValue < 5 ? '✅' : '❌'}`);
  console.log('='.repeat(80) + '\n');
  
  return {
    'stdout': JSON.stringify(data, null, 2),
    'results/summary.json': JSON.stringify(data, null, 2),
  };
}

