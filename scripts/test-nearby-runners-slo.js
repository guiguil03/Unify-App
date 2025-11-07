// scripts/test-nearby-runners-slo.js
const https = require('https');
const { performance } = require('perf_hooks');

// Configuration
const SUPABASE_URL = 'https://muhexuopzmqdxonurktn.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11aGV4dW9wem1xZHhvbnVya3RuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0NTYyMzMsImV4cCI6MjA3ODAzMjIzM30.Q9c9BDzB1NeLOftXq4A9aqDM3bltWwcEL_LNJNxM3JI';

// Métriques
const metrics = {
  users: [],      // Métriques pour l'endpoint /users
  runners: [],    // Métriques pour l'endpoint /runners
  combined: []    // Métriques pour l'opération complète getNearbyRunners
};

// SLO Thresholds
const SLO_THRESHOLDS = {
  users: {
    name: 'GET /rest/v1/users (récupérer utilisateurs)',
    latency_p95: 300,    // 300ms
    error_rate: 3        // 3%
  },
  runners: {
    name: 'GET /rest/v1/runners (récupérer activités)',
    latency_p95: 300,    // 300ms
    error_rate: 3        // 3%
  },
  combined: {
    name: 'getNearbyRunners (opération complète)',
    latency_p95: 600,    // 600ms (somme des deux appels)
    error_rate: 5        // 5%
  }
};

/**
 * Fait une requête HTTP et mesure la latence
 */
function makeRequest(endpoint, query = '') {
  return new Promise((resolve, reject) => {
    const startTime = performance.now();
    const url = `${SUPABASE_URL}${endpoint}${query}`;
    
    const options = {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      }
    };

    https.get(url, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const latency = performance.now() - startTime;
        const isError = res.statusCode >= 500;
        
        resolve({
          statusCode: res.statusCode,
          latency,
          isError,
          data: data
        });
      });
    }).on('error', (error) => {
      const latency = performance.now() - startTime;
      reject({
        statusCode: 500,
        latency,
        isError: true,
        error: error.message
      });
    });
  });
}

/**
 * Simule l'appel getNearbyRunners
 */
async function testGetNearbyRunners() {
  const startTime = performance.now();
  let isError = false;
  
  try {
    // 1. Appel à /users
    const usersQuery = '?select=id,name,avatar,bio,last_latitude,last_longitude,updated_at&last_latitude=not.is.null&last_longitude=not.is.null';
    const usersResult = await makeRequest('/rest/v1/users', usersQuery);
    
    metrics.users.push({
      latency: usersResult.latency,
      statusCode: usersResult.statusCode,
      isError: usersResult.isError
    });
    
    // Simuler le filtrage côté client (rapide)
    const users = JSON.parse(usersResult.data || '[]');
    const userIds = users.slice(0, 50).map(u => u.id);
    
    // 2. Appel à /runners si on a des users
    if (userIds.length > 0) {
      const runnersQuery = `?select=user_id,is_active,pace,distance,updated_at&user_id=in.(${userIds.join(',')})`;
      const runnersResult = await makeRequest('/rest/v1/runners', runnersQuery);
      
      metrics.runners.push({
        latency: runnersResult.latency,
        statusCode: runnersResult.statusCode,
        isError: runnersResult.isError
      });
      
      if (runnersResult.isError) isError = true;
    }
    
    if (usersResult.isError) isError = true;
    
  } catch (error) {
    isError = true;
    console.error('Erreur:', error.message || error);
  }
  
  const totalLatency = performance.now() - startTime;
  
  metrics.combined.push({
    latency: totalLatency,
    isError
  });
  
  return { latency: totalLatency, isError };
}

/**
 * Calcule le percentile
 */
function calculatePercentile(sortedArray, percentile) {
  if (sortedArray.length === 0) return 0;
  const index = Math.ceil((percentile / 100) * sortedArray.length) - 1;
  return sortedArray[Math.max(0, index)];
}

/**
 * Génère un rapport SLO
 */
function generateReport(metricType, thresholds) {
  const data = metrics[metricType];
  
  if (data.length === 0) {
    return null;
  }
  
  const latencies = data.map(m => m.latency).sort((a, b) => a - b);
  const errors = data.filter(m => m.isError).length;
  const errorRate = (errors / data.length) * 100;
  
  const p50 = calculatePercentile(latencies, 50);
  const p95 = calculatePercentile(latencies, 95);
  const p99 = calculatePercentile(latencies, 99);
  
  const latencyMet = p95 <= thresholds.latency_p95;
  const errorsMet = errorRate <= thresholds.error_rate;
  
  return {
    name: thresholds.name,
    totalRequests: data.length,
    successRequests: data.length - errors,
    errorRequests: errors,
    latencyP50: p50.toFixed(2),
    latencyP95: p95.toFixed(2),
    latencyP99: p99.toFixed(2),
    errorRate: errorRate.toFixed(2),
    thresholds,
    sloMet: {
      latency: latencyMet,
      errors: errorsMet
    }
  };
}

/**
 * Affiche le rapport
 */
function printReport() {
  console.log('\n' + '='.repeat(80));
  console.log('📊 RAPPORT SLO - API NEARBY RUNNERS');
  console.log('='.repeat(80));
  
  ['users', 'runners', 'combined'].forEach(type => {
    const report = generateReport(type, SLO_THRESHOLDS[type]);
    
    if (!report) return;
    
    console.log(`\n🎯 ${report.name}`);
    console.log(`   Requêtes totales: ${report.totalRequests}`);
    console.log(`   Succès: ${report.successRequests} | Erreurs: ${report.errorRequests}`);
    console.log(`   Latence p50: ${report.latencyP50}ms`);
    console.log(`   Latence p95: ${report.latencyP95}ms (seuil: ${report.thresholds.latency_p95}ms) ${report.sloMet.latency ? '✅' : '❌'}`);
    console.log(`   Latence p99: ${report.latencyP99}ms`);
    console.log(`   Taux d'erreur: ${report.errorRate}% (seuil: ${report.thresholds.error_rate}%) ${report.sloMet.errors ? '✅' : '❌'}`);
    
    const overallStatus = report.sloMet.latency && report.sloMet.errors ? '✅ SLO RESPECTÉ' : '❌ SLO NON RESPECTÉ';
    console.log(`   Status: ${overallStatus}`);
  });
  
  console.log('\n' + '='.repeat(80) + '\n');
}

/**
 * Lance le test de charge
 */
async function runLoadTest() {
  const numberOfTests = 50; // Nombre de fois à tester
  
  console.log('🚀 Démarrage du test de charge SLO pour getNearbyRunners');
  console.log(`📍 Endpoint: ${SUPABASE_URL}`);
  console.log(`🔢 Nombre de tests: ${numberOfTests}\n`);
  
  for (let i = 1; i <= numberOfTests; i++) {
    process.stdout.write(`\r⏳ Progression: ${i}/${numberOfTests}`);
    
    try {
      await testGetNearbyRunners();
      
      // Petit délai entre les requêtes pour ne pas surcharger
      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (error) {
      console.error(`\n❌ Erreur test ${i}:`, error);
    }
  }
  
  console.log('\n\n✅ Tests terminés!\n');
  
  // Afficher le rapport
  printReport();
}

// Lancer les tests
runLoadTest().catch(console.error);

