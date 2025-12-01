// k6 Soak Test - Endpoints réels (test d'endurance pour détecter fuites mémoire)
import http from "k6/http";
import { check, sleep } from "k6";
import { Rate } from "k6/metrics";

const errorRate = new Rate("errors");

const testLocations = [
  { lat: 48.8566, lon: 2.3522 }, // Paris
  { lat: 45.764, lon: 4.8357 }, // Lyon
];

export const options = {
  stages: [
    { duration: "2m", target: 20 }, // Monter à 20 VUs
    { duration: "30m", target: 20 }, // Maintenir pendant 30 minutes
    { duration: "2m", target: 0 }, // Descendre
  ],
  thresholds: {
    http_req_duration: ["p(95)<800"], // Doit rester stable dans le temps
    errors: ["rate<0.05"],
  },
};

const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";
const headers = { "Content-Type": "application/json" };

export default function () {
  // Simuler un utilisateur typique qui alterne entre les fonctionnalités

  // 1. Rechercher des runners à proximité
  const location =
    testLocations[Math.floor(Math.random() * testLocations.length)];
  const res1 = http.get(
    `${BASE_URL}/api/nearby-runners?lat=${location.lat}&lon=${location.lon}&radius=10`,
    { headers }
  );

  check(res1, {
    "nearby-runners OK": (r) => r.status === 200,
    "nearby-runners latency OK": (r) => r.timings.duration < 800,
  });

  errorRate.add(res1.status >= 500);
  sleep(2);

  // 2. Consulter sa liste d'amis
  const testUserId =
    __ENV.TEST_USER_ID || "06a73148-7a83-4dcf-b6a8-b5a3a1e7d699";
  const res2 = http.get(`${BASE_URL}/api/contacts?userId=${testUserId}`, {
    headers,
  });

  check(res2, {
    "contacts OK": (r) => r.status === 200 || r.status === 400,
    "contacts latency OK": (r) => r.timings.duration < 600,
  });

  errorRate.add(res2.status >= 500);
  sleep(3);
}

export function handleSummary(data) {
  const p95 = data.metrics["http_req_duration"].values["p(95)"];
  const errorRateValue = data.metrics["errors"].values.rate * 100;

  console.log("\n" + "=".repeat(80));
  console.log("📊 RÉSUMÉ DU TEST D'ENDURANCE - ENDPOINTS RÉELS");
  console.log("=".repeat(80));
  console.log(`✅ Requêtes totales: ${data.metrics["http_reqs"].values.count}`);
  console.log(
    `✅ Requêtes/sec: ${data.metrics["http_reqs"].values.rate.toFixed(2)}`
  );
  console.log(
    `✅ Latence p95: ${p95.toFixed(2)}ms (seuil: 800ms) ${p95 < 800 ? "✅" : "❌"}`
  );
  console.log(
    `✅ Taux d'erreur: ${errorRateValue.toFixed(2)}% (seuil: 5%) ${errorRateValue < 5 ? "✅" : "❌"}`
  );
  console.log(
    "⚠️  Vérifier que la latence ne dégrade pas dans le temps (signe de fuite mémoire)"
  );
  console.log("=".repeat(80) + "\n");

  return {
    stdout: JSON.stringify(data, null, 2),
    "results/soak-real-endpoints-summary.json": JSON.stringify(data, null, 2),
  };
}
