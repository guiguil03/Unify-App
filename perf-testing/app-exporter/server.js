const express = require('express');
const promClient = require('prom-client');
const { createClient } = require('@supabase/supabase-js');
const pino = require('pino');
const pinoHttp = require('pino-http');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// CONFIGURATION PINO (LOGS JSON STRUCTURÉS)
// ============================================
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label) => {
      return { level: label };
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  base: {
    service: 'unify-app-exporter',
    environment: process.env.NODE_ENV || 'development',
  },
});

// Middleware Pino HTTP avec request_id
const pinoMiddleware = pinoHttp({
  logger,
  genReqId: (req) => req.headers['x-request-id'] || uuidv4(),
  customLogLevel: (req, res, err) => {
    if (res.statusCode >= 500 || err) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },
  customSuccessMessage: (req, res) => {
    return `${req.method} ${req.url} - ${res.statusCode}`;
  },
  customErrorMessage: (req, res, err) => {
    return `${req.method} ${req.url} - ${res.statusCode} - ${err.message}`;
  },
  serializers: {
    req: (req) => ({
      id: req.id,
      method: req.method,
      url: req.url,
      headers: {
        host: req.headers.host,
        'user-agent': req.headers['user-agent'],
      },
    }),
    res: (res) => ({
      statusCode: res.statusCode,
    }),
  },
});

// ============================================
// CONFIGURATION PROMETHEUS
// ============================================
const register = new promClient.Registry();

// Métriques par défaut (CPU, RAM, etc.)
promClient.collectDefaultMetrics({ 
  register,
  prefix: 'unify_',
});

// Histogramme HTTP (avec labels: method, endpoint, status_code) EN MILLISECONDES
const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_ms',
  help: 'Durée des requêtes HTTP en millisecondes',
  labelNames: ['method', 'endpoint', 'status_code'],
  buckets: [10, 20, 50, 100, 200, 300, 400, 500, 750, 1000, 2000, 5000],
  registers: [register],
});

const httpRequestsTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Nombre total de requêtes HTTP',
  labelNames: ['method', 'endpoint', 'status_code'],
  registers: [register],
});

// Event Loop Lag Gauge
const eventLoopLag = new promClient.Gauge({
  name: 'nodejs_eventloop_lag_seconds',
  help: 'Event loop lag en secondes',
  registers: [register],
});

// Mesurer l'event loop lag toutes les secondes
let lastCheck = Date.now();
setInterval(() => {
  const now = Date.now();
  const delay = (now - lastCheck - 1000) / 1000; // Convertir en secondes
  eventLoopLag.set(Math.max(0, delay));
  lastCheck = now;
}, 1000);

// Métriques DB Supabase EN SECONDES
const supabaseQueryDuration = new promClient.Histogram({
  name: 'supabase_query_duration_seconds',
  help: 'Durée des requêtes Supabase en secondes',
  labelNames: ['table', 'operation'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.2, 0.5, 1, 2],
  registers: [register],
});

const supabaseQueryTotal = new promClient.Counter({
  name: 'supabase_query_total',
  help: 'Nombre total de requêtes Supabase',
  labelNames: ['table', 'operation', 'status'],
  registers: [register],
});

// ============================================
// MIDDLEWARES
// ============================================

// Pino HTTP logging avec request_id
app.use(pinoMiddleware);

// Middleware pour mesurer les requêtes HTTP
app.use((req, res, next) => {
  const start = process.hrtime.bigint();

  // Propager le request_id
  res.setHeader('X-Request-ID', req.id);
  
  res.on('finish', () => {
    const durationNs = process.hrtime.bigint() - start;
    const durationMs = Number(durationNs) / 1e6;
    const endpoint = req.route?.path || req.path || req.originalUrl || 'unknown';
    const labels = {
      method: req.method,
      endpoint,
      status_code: String(res.statusCode),
    };
    
    httpRequestDuration.observe(labels, durationMs);
    httpRequestsTotal.inc(labels);
  });
  
  next();
});

// ============================================
// CLIENT SUPABASE
// ============================================
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_API_KEY
);

// Helper pour mesurer les requêtes Supabase
async function measureSupabaseQuery(table, operation, queryFn) {
  const start = Date.now();
  let status = 'success';
  
  try {
    const result = await queryFn();
    const duration = (Date.now() - start) / 1000;
    
    if (result.error) {
      status = 'error';
      throw result.error;
    }
    
    supabaseQueryDuration.observe({ table, operation }, duration);
    supabaseQueryTotal.inc({ table, operation, status });
    
    console.log(`[Supabase] ${table}.${operation} - ${(duration * 1000).toFixed(2)}ms - ${result.data?.length || 0} rows`);
    
    return result;
  } catch (error) {
    const duration = (Date.now() - start) / 1000;
    status = 'error';
    
    supabaseQueryDuration.observe({ table, operation }, duration);
    supabaseQueryTotal.inc({ table, operation, status });
    
    console.error(`[Supabase ERROR] ${table}.${operation} - ${error.message}`);
    throw error;
  }
}

// ============================================
// ROUTES
// ============================================

// Endpoint de métriques pour Prometheus
app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    const metrics = await register.metrics();
    res.end(metrics);
  } catch (error) {
    console.error('[ERROR] Failed to generate metrics:', error.message);
    res.status(500).json({ error: 'Failed to generate metrics' });
  }
});

// Endpoint de santé
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Proxy pour tester les endpoints Supabase avec métriques
app.get('/api/users', async (req, res) => {
  try {
    const result = await measureSupabaseQuery('users', 'SELECT', () =>
      supabase
        .from('users')
        .select('id,name,avatar,bio,last_latitude,last_longitude,updated_at')
        .not('last_latitude', 'is', null)
        .not('last_longitude', 'is', null)
    );
    
    res.json(result.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/runners', async (req, res) => {
  try {
    const result = await measureSupabaseQuery('runners', 'SELECT', () =>
      supabase
        .from('runners')
        .select('user_id,is_active,pace,distance,updated_at')
    );
    
    res.json(result.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/activities', async (req, res) => {
  try {
    const result = await measureSupabaseQuery('activities', 'SELECT', () =>
      supabase
        .from('activities')
        .select('*')
        .order('date', { ascending: false })
        .limit(50)
    );
    
    res.json(result.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/friends', async (req, res) => {
  try {
    const result = await measureSupabaseQuery('contacts', 'SELECT', () =>
      supabase
        .from('contacts')
        .select('id,user_id,friend_id,status,created_at,updated_at')
    );
    
    res.json(result.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// DÉMARRAGE DU SERVEUR
// ============================================
app.listen(PORT, () => {
  console.log(`🚀 Exporteur de métriques Unify démarré sur http://localhost:${PORT}`);
  console.log(`📊 Métriques Prometheus sur http://localhost:${PORT}/metrics`);
  console.log(`💚 Health check sur http://localhost:${PORT}/health`);
});
                                                        