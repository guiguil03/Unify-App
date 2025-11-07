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

const SUPABASE_URL = __ENV.SUPABASE_URL || 'https://muhexuopzmqdxonurktn.supabase.co';
const SUPABASE_KEY = __ENV.SUPABASE_API_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11aGV4dW9wem1xZHhvbnVya3RuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0NTYyMzMsImV4cCI6MjA3ODAzMjIzM30.Q9c9BDzB1NeLOftXq4A9aqDM3bltWwcEL_LNJNxM3JI';

const headers = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json'
};

export default function () {
  // Simuler un utilisateur typique
  const res = http.get(
    `${SUPABASE_URL}/rest/v1/users?select=id,name,avatar,last_latitude,last_longitude&last_latitude=not.is.null&limit=30`,
    { headers }
  );
  
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time OK': (r) => r.timings.duration < 600,
  });
  
  errorRate.add(res.status >= 500);
  sleep(2); // Pause réaliste entre les actions
}

