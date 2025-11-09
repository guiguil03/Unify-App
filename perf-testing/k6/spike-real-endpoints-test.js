// k6 Spike Test - Endpoints réels (pics soudains de trafic)
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
    { duration: "1m", target: 10 }, // Trafic normal
    { duration: "10s", target: 200 }, // SPIKE!
    { duration: "1m", target: 200 }, // Maintenir le spike
    { duration: "10s", target: 10 }, // Retour à la normale
    { duration: "1m", target: 10 }, // Trafic normal
    { duration: "10s", target: 300 }, // SPIKE plus fort!
    { duration: "30s", target: 300 }, // Maintenir
    { duration: "10s", target: 0 }, // Fin
  ],
  thresholds: {
    http_req_duration: ["p(95)<1500"], // Seuil permissif pendant les spikes
    errors: ["rate<0.15"], // Jusqu'à 15% d'erreurs pendant les spikes
  },
};

const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";
const headers = { "Content-Type": "application/json" };

export default function () {
  // Alterner entre nearby-runners (lourd) et contacts (moyen)
  const useNearby = Math.random() > 0.5;

  if (useNearby) {
    const location =
      testLocations[Math.floor(Math.random() * testLocations.length)];
    const res = http.get(
      `${BASE_URL}/api/nearby-runners?lat=${location.lat}&lon=${location.lon}&radius=10`,
      { headers }
    );

    check(res, {
      "status OK during spike": (r) => r.status === 200 || r.status === 429,
    });

    errorRate.add(res.status >= 500);
  } else {
    const testUserId =
      __ENV.TEST_USER_ID || "c2608579-10a8-41d9-a566-d8c081dc4ab9";
    const res = http.get(`${BASE_URL}/api/contacts?userId=${testUserId}`, {
      headers,
    });

    check(res, {
      "status OK during spike": (r) =>
        r.status === 200 || r.status === 400 || r.status === 429,
    });

    errorRate.add(res.status >= 500);
  }

  sleep(0.1); // Très peu de pause pour créer du trafic intense
}

export function handleSummary(data) {
  const p95 = data.metrics["http_req_duration"].values["p(95)"];
  const errorRateValue = data.metrics["errors"].values.rate * 100;

  console.log("\n" + "=".repeat(80));
  console.log("📊 RÉSUMÉ DU TEST DE SPIKE - ENDPOINTS RÉELS");
  console.log("=".repeat(80));
  console.log(`✅ Requêtes totales: ${data.metrics["http_reqs"].values.count}`);
  console.log(
    `✅ Requêtes/sec: ${data.metrics["http_reqs"].values.rate.toFixed(2)}`
  );
  console.log(
    `✅ Latence p95: ${p95.toFixed(2)}ms (seuil: 1500ms) ${p95 < 1500 ? "✅" : "❌"}`
  );
  console.log(
    `✅ Taux d'erreur: ${errorRateValue.toFixed(2)}% (seuil: 15%) ${errorRateValue < 15 ? "✅" : "❌"}`
  );
  console.log("=".repeat(80) + "\n");

  return {
    stdout: JSON.stringify(data, null, 2),
    "results/spike-real-endpoints-summary.json": JSON.stringify(data, null, 2),
  };
}
