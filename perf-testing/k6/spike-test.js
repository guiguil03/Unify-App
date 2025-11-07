// k6 Spike Test - Test de pics soudains de trafic
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: '1m', target: 10 },    // Trafic normal
    { duration: '10s', target: 200 },  // SPIKE!
    { duration: '1m', target: 200 },   // Maintenir le spike
    { duration: '10s', target: 10 },   // Retour à la normale
    { duration: '1m', target: 10 },    // Trafic normal
    { duration: '10s', target: 300 },  // SPIKE plus fort!
    { duration: '30s', target: 300 },  // Maintenir
    { duration: '10s', target: 0 },    // Fin
  ],
  thresholds: {
    'http_req_duration': ['p(95)<1500'], // Seuil permissif pendant les spikes
    'errors': ['rate<0.15'],             // Jusqu'à 15% d'erreurs pendant les spikes
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
    `${SUPABASE_URL}/rest/v1/users?select=id,name,last_latitude,last_longitude&last_latitude=not.is.null&limit=50`,
    { headers }
  );
  
  check(res, {
    'status is 200 or 429': (r) => r.status === 200 || r.status === 429, // Rate limiting accepté
  });
  
  errorRate.add(res.status >= 500);
  sleep(0.1); // Très peu de pause pour créer du trafic intense
}

