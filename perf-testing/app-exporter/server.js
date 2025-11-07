const express = require('express');
const promClient = require('prom-client');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;

// Créer un registre pour les métriques
const register = new promClient.Registry();

// Métriques par défaut (CPU, RAM, etc.)
promClient.collectDefaultMetrics({ register });

// Métriques custom pour Unify App
const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_ms',
  help: 'Durée des requêtes HTTP en millisecondes',
  labelNames: ['method', 'endpoint', 'status_code'],
  buckets: [10, 50, 100, 200, 300, 500, 1000, 2000, 5000]
});

const httpRequestsTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Nombre total de requêtes HTTP',
  labelNames: ['method', 'endpoint', 'status_code']
});

const supabaseQueryDuration = new promClient.Histogram({
  name: 'supabase_query_duration_ms',
  help: 'Durée des requêtes Supabase en millisecondes',
  labelNames: ['table', 'operation'],
  buckets: [10, 50, 100, 200, 500, 1000, 2000]
});

// Enregistrer les métriques
register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestsTotal);
register.registerMetric(supabaseQueryDuration);

// Middleware pour mesurer les requêtes
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const labels = {
      method: req.method,
      endpoint: req.route ? req.route.path : req.path,
      status_code: res.statusCode
    };
    
    httpRequestDuration.observe(labels, duration);
    httpRequestsTotal.inc(labels);
  });
  
  next();
});

// Client Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_API_KEY
);

// Endpoint de métriques pour Prometheus
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// Endpoint de santé
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Proxy pour tester les endpoints Supabase avec métriques
app.get('/api/users', async (req, res) => {
  const start = Date.now();
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id,name,avatar,bio,last_latitude,last_longitude,updated_at')
      .not('last_latitude', 'is', null)
      .not('last_longitude', 'is', null);
    
    const duration = Date.now() - start;
    supabaseQueryDuration.observe({ table: 'users', operation: 'SELECT' }, duration);
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/runners', async (req, res) => {
  const start = Date.now();
  try {
    const { data, error } = await supabase
      .from('runners')
      .select('user_id,is_active,pace,distance,updated_at');
    
    const duration = Date.now() - start;
    supabaseQueryDuration.observe({ table: 'runners', operation: 'SELECT' }, duration);
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/activities', async (req, res) => {
  const start = Date.now();
  try {
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .order('date', { ascending: false })
      .limit(50);
    
    const duration = Date.now() - start;
    supabaseQueryDuration.observe({ table: 'activities', operation: 'SELECT' }, duration);
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Démarrer le serveur
app.listen(PORT, () => {
  console.log(`🚀 Exporteur de métriques Unify démarré sur http://localhost:${PORT}`);
  console.log(`📊 Métriques disponibles sur http://localhost:${PORT}/metrics`);
});

