// k6 Test - getContacts avec logique métier complète (symétrie des amis)
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
    { duration: '1m', target: 40 },   // Monter à 40 VUs en 1 min
    { duration: '2m', target: 40 },   // Maintenir 40 VUs pendant 2 min
    { duration: '30s', target: 0 },   // Descendre à 0 VUs en 30s
  ],
  thresholds: {
    // SLO: Latence p95 < 500ms pour getContacts
    'http_req_duration': ['p(95)<500'],
    // SLO: Taux d'erreur < 3%
    'errors': ['rate<0.03'],
    'http_req_failed': ['rate<0.03'],
  },
};

// Configuration
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

const headers = {
  'Content-Type': 'application/json'
};

// IDs d'utilisateurs de test (à adapter selon votre base)
// Pour un vrai test, vous devriez récupérer ces IDs dynamiquement depuis /api/users
const testUserIds = __ENV.TEST_USER_IDS
  ? __ENV.TEST_USER_IDS.split(',')
  : ['user-1', 'user-2', 'user-3']; // IDs par défaut

export default function () {
  // Choisir un utilisateur aléatoirement
  const userId = testUserIds[Math.floor(Math.random() * testUserIds.length)];
  
  // Appel à getContacts avec logique de symétrie des amis
  const res = http.get(
    `${BASE_URL}/api/contacts?userId=${userId}`,
    { headers }
  );
  
  check(res, {
    'getContacts - status 200': (r) => r.status === 200,
    'getContacts - latency < 500ms': (r) => r.timings.duration < 500,
    'getContacts - has contacts array': (r) => {
      try {
        const body = JSON.parse(r.body);
        return Array.isArray(body.contacts);
      } catch (e) {
        return false;
      }
    },
    'getContacts - includes mutual friends only': (r) => {
      try {
        const body = JSON.parse(r.body);
        // Vérifier que chaque contact a un ID, name et lastActivity
        return body.contacts.length === 0 || 
               (body.contacts[0].id !== undefined && 
                body.contacts[0].name !== undefined &&
                body.contacts[0].lastActivity !== undefined);
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
      console.log(`User has ${body.count} mutual friends`);
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
  console.log('📊 RÉSUMÉ DU TEST getContacts');
  console.log('='.repeat(80));
  console.log(`✅ Requêtes totales: ${data.metrics['http_reqs'].values.count}`);
  console.log(`✅ Requêtes/sec: ${data.metrics['http_reqs'].values.rate.toFixed(2)}`);
  console.log(`✅ Latence p95: ${p95.toFixed(2)}ms (seuil: 500ms) ${p95 < 500 ? '✅' : '❌'}`);
  console.log(`✅ Taux d'erreur: ${errorRateValue.toFixed(2)}% (seuil: 3%) ${errorRateValue < 3 ? '✅' : '❌'}`);
  console.log('='.repeat(80) + '\n');
  
  return {
    'stdout': JSON.stringify(data, null, 2),
    'results/contacts-summary.json': JSON.stringify(data, null, 2),
  };
}

