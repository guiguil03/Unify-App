// k6 Soak Test - Test d'endurance (longue durée)
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: '2m', target: 30 },    // Monter à 30 VUs
    { duration: '30m', target: 30 },   // Maintenir pendant 30 minutes
    { duration: '2m', target: 0 },     // Descendre
  ],
  thresholds: {
    'http_req_duration': ['p(95)<600'],
    'errors': ['rate<0.05'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

const headers = {
  'Content-Type': 'application/json'
};

export default function () {
  // Simuler un utilisateur typique
  const res = http.get(
    `${BASE_URL}/api/users?limit=30`,
    { headers }
  );

  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time OK': (r) => r.timings.duration < 600,
  });

  errorRate.add(res.status >= 500);
  sleep(2); // Pause réaliste entre les actions
}

