// k6 Stress Test - Test de stress avec montée progressive
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

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

const SUPABASE_URL = __ENV.SUPABASE_URL || 'https://muhexuopzmqdxonurktn.supabase.co';
const SUPABASE_KEY = __ENV.SUPABASE_API_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11aGV4dW9wem1xZHhvbnVya3RuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0NTYyMzMsImV4cCI6MjA3ODAzMjIzM30.Q9c9BDzB1NeLOftXq4A9aqDM3bltWwcEL_LNJNxM3JI';

const headers = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json'
};

export default function () {
  const res = http.get(
    `${SUPABASE_URL}/rest/v1/users?select=id,name,avatar,bio,last_latitude,last_longitude,updated_at&last_latitude=not.is.null&last_longitude=not.is.null`,
    { headers }
  );
  
  check(res, {
    'status is 200': (r) => r.status === 200,
  });
  
  errorRate.add(res.status >= 500);
  sleep(1);
}

