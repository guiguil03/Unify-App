// k6 Stress Test - Test de stress avec montée progressive
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

const endpoints = [
  {
    name: 'users',
    url: (baseUrl) => `${baseUrl}/api/users`,
  },
  {
    name: 'runners',
    url: (baseUrl) => `${baseUrl}/api/runners`,
  },
  {
    name: 'activities',
    url: (baseUrl) => `${baseUrl}/api/activities`,
  },
  {
    name: 'friends',
    url: (baseUrl) => `${baseUrl}/api/contacts`,
  },
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

const headers = {
  'Content-Type': 'application/json'
};

export default function () {
  const responses = endpoints.map((endpoint) => ({
    name: endpoint.name,
    res: http.get(endpoint.url(BASE_URL), { headers }),
  }));

  responses.forEach(({ name, res }) => {
    check(res, {
      [`${name} status is 200`]: (r) => r.status === 200,
    });

    errorRate.add(res.status >= 500 ? 1 : 0);
  });

  sleep(1);
}

