const express = require("express");
const promClient = require("prom-client");
const { createClient } = require("@supabase/supabase-js");
const pino = require("pino");
const pinoHttp = require("pino-http");
const { v4: uuidv4 } = require("uuid");

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// CONFIGURATION PINO (LOGS JSON STRUCTURÉS)
// ============================================
const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  formatters: {
    level: (label) => {
      return { level: label };
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  base: {
    service: "unify-app-exporter",
    environment: process.env.NODE_ENV || "development",
  },
});

// Middleware Pino HTTP avec request_id
const pinoMiddleware = pinoHttp({
  logger,
  genReqId: (req) => req.headers["x-request-id"] || uuidv4(),
  customLogLevel: (req, res, err) => {
    if (res.statusCode >= 500 || err) return "error";
    if (res.statusCode >= 400) return "warn";
    return "info";
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
        "user-agent": req.headers["user-agent"],
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
  prefix: "unify_",
});

// Histogramme HTTP (avec labels: method, endpoint, status_code) EN MILLISECONDES
const httpRequestDuration = new promClient.Histogram({
  name: "http_request_duration_ms",
  help: "Durée des requêtes HTTP en millisecondes",
  labelNames: ["method", "endpoint", "status_code"],
  buckets: [10, 20, 50, 100, 200, 300, 400, 500, 750, 1000, 2000, 5000],
  registers: [register],
});

const httpRequestsTotal = new promClient.Counter({
  name: "http_requests_total",
  help: "Nombre total de requêtes HTTP",
  labelNames: ["method", "endpoint", "status_code"],
  registers: [register],
});

// Event Loop Lag Gauge
const eventLoopLag = new promClient.Gauge({
  name: "nodejs_eventloop_lag_seconds",
  help: "Event loop lag en secondes",
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
  name: "supabase_query_duration_seconds",
  help: "Durée des requêtes Supabase en secondes",
  labelNames: ["table", "operation"],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.2, 0.5, 1, 2],
  registers: [register],
});

const supabaseQueryTotal = new promClient.Counter({
  name: "supabase_query_total",
  help: "Nombre total de requêtes Supabase",
  labelNames: ["table", "operation", "status"],
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
  res.setHeader("X-Request-ID", req.id);

  res.on("finish", () => {
    const durationNs = process.hrtime.bigint() - start;
    const durationMs = Number(durationNs) / 1e6;
    const endpoint =
      req.route?.path || req.path || req.originalUrl || "unknown";
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
  let status = "success";

  try {
    const result = await queryFn();
    const duration = (Date.now() - start) / 1000;

    if (result.error) {
      status = "error";
      throw result.error;
    }

    supabaseQueryDuration.observe({ table, operation }, duration);
    supabaseQueryTotal.inc({ table, operation, status });

    console.log(
      `[Supabase] ${table}.${operation} - ${(duration * 1000).toFixed(2)}ms - ${result.data?.length || 0} rows`
    );

    return result;
  } catch (error) {
    const duration = (Date.now() - start) / 1000;
    status = "error";

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
app.get("/metrics", async (req, res) => {
  try {
    res.set("Content-Type", register.contentType);
    const metrics = await register.metrics();
    res.end(metrics);
  } catch (error) {
    console.error("[ERROR] Failed to generate metrics:", error.message);
    res.status(500).json({ error: "Failed to generate metrics" });
  }
});

// Endpoint de santé
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Proxy pour tester les endpoints Supabase avec métriques
app.get("/api/users", async (req, res) => {
  try {
    const result = await measureSupabaseQuery("users", "SELECT", () =>
      supabase
        .from("users")
        .select("id,name,avatar,bio,last_latitude,last_longitude,updated_at")
        .not("last_latitude", "is", null)
        .not("last_longitude", "is", null)
    );

    res.json(result.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/runners", async (req, res) => {
  try {
    const result = await measureSupabaseQuery("runners", "SELECT", () =>
      supabase
        .from("runners")
        .select("user_id,is_active,pace,distance,updated_at")
    );

    res.json(result.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/activities", async (req, res) => {
  try {
    const result = await measureSupabaseQuery("activities", "SELECT", () =>
      supabase
        .from("activities")
        .select("*")
        .order("date", { ascending: false })
        .limit(50)
    );

    res.json(result.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/friends", async (req, res) => {
  try {
    const result = await measureSupabaseQuery("contacts", "SELECT", () =>
      supabase
        .from("contacts")
        .select("id,user_id,friend_id,status,created_at,updated_at")
    );

    res.json(result.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// ENDPOINTS AVEC LOGIQUE MÉTIER COMPLÈTE
// ============================================

/**
 * Calcule la distance entre deux points (formule de Haversine)
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Rayon de la Terre en km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * GET /api/nearby-runners
 * Récupère les runners à proximité avec calcul de distance (logique métier complète)
 * Query params:
 *   - lat (required): latitude
 *   - lon (required): longitude
 *   - radius (optional): rayon en km (default: 5)
 */
app.get("/api/nearby-runners", async (req, res) => {
  const start = Date.now();

  try {
    const { lat, lon, radius = 5 } = req.query;

    if (!lat || !lon) {
      return res
        .status(400)
        .json({ error: "lat and lon parameters are required" });
    }

    const currentLat = parseFloat(lat);
    const currentLon = parseFloat(lon);
    const radiusKm = parseFloat(radius);

    // Étape 1: Récupérer tous les utilisateurs avec position
    const usersResult = await measureSupabaseQuery("users", "SELECT", () =>
      supabase
        .from("users")
        .select(
          "id, name, avatar, bio, last_latitude, last_longitude, updated_at"
        )
        .not("last_latitude", "is", null)
        .not("last_longitude", "is", null)
    );

    if (usersResult.error) {
      throw usersResult.error;
    }

    // Étape 2: Calculer les distances et filtrer par rayon
    const nearbyUsers = (usersResult.data || [])
      .map((user) => {
        const distance = calculateDistance(
          currentLat,
          currentLon,
          Number(user.last_latitude),
          Number(user.last_longitude)
        );
        return { ...user, calculatedDistance: distance };
      })
      .filter((user) => user.calculatedDistance <= radiusKm)
      .sort((a, b) => a.calculatedDistance - b.calculatedDistance)
      .slice(0, 50); // Limiter à 50 résultats

    // Étape 3: Récupérer les infos d'activité des runners
    const userIds = nearbyUsers.map((u) => u.id);

    let runnersData = [];
    if (userIds.length > 0) {
      const runnersResult = await measureSupabaseQuery(
        "runners",
        "SELECT",
        () =>
          supabase
            .from("runners")
            .select("user_id, is_active, pace, distance, updated_at")
            .in("user_id", userIds)
      );

      if (!runnersResult.error) {
        runnersData = runnersResult.data || [];
      }
    }

    // Étape 4: Joindre les données
    const runnersMap = new Map(runnersData.map((r) => [r.user_id, r]));

    const result = nearbyUsers.map((user) => {
      const runnerInfo = runnersMap.get(user.id);
      return {
        id: user.id,
        name: user.name || "Utilisateur inconnu",
        location: {
          latitude: Number(user.last_latitude),
          longitude: Number(user.last_longitude),
        },
        distance: user.calculatedDistance,
        pace: runnerInfo?.pace || "",
        avatar: user.avatar,
        bio: user.bio,
        isActive: runnerInfo?.is_active || false,
        lastSeen: runnerInfo?.updated_at || user.updated_at,
      };
    });

    const duration = Date.now() - start;
    req.log.info(
      { duration, count: result.length, radius: radiusKm },
      "getNearbyRunners completed"
    );

    res.json({
      runners: result,
      count: result.length,
      radius: radiusKm,
      center: { latitude: currentLat, longitude: currentLon },
    });
  } catch (error) {
    req.log.error({ error: error.message }, "Error in getNearbyRunners");
    res.status(500).json({ error: error.message });
  }
});

/**
 * Formate la dernière activité
 */
function formatLastActivity(date) {
  const now = new Date();
  const activityDate = new Date(date);
  const diffMs = now.getTime() - activityDate.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 1) {
    return "Il y a moins d'une heure";
  } else if (diffHours < 24) {
    return `Il y a ${diffHours}h`;
  } else if (diffDays === 1) {
    return "Il y a 1j";
  } else {
    return `Il y a ${diffDays}j`;
  }
}

/**
 * GET /api/contacts
 * Récupère la liste des contacts/amis avec logique de symétrie
 * Query params:
 *   - userId (required): ID de l'utilisateur
 */
app.get("/api/contacts", async (req, res) => {
  const start = Date.now();

  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: "userId parameter is required" });
    }

    // Étape 1: Récupérer les contacts envoyés et reçus en parallèle
    const [sentResult, receivedResult] = await Promise.all([
      measureSupabaseQuery("contacts", "SELECT_SENT", () =>
        supabase
          .from("contacts")
          .select(
            `
            last_interaction,
            contact:users!contacts_contact_id_fkey(id, name, avatar)
          `
          )
          .eq("user_id", userId)
          .eq("status", "accepted")
      ),
      measureSupabaseQuery("contacts", "SELECT_RECEIVED", () =>
        supabase
          .from("contacts")
          .select(
            `
            last_interaction,
            sender:users!contacts_user_id_fkey(id, name, avatar)
          `
          )
          .eq("contact_id", userId)
          .eq("status", "accepted")
      ),
    ]);

    if (sentResult.error) {
      throw sentResult.error;
    }

    if (receivedResult.error) {
      throw receivedResult.error;
    }

    // Étape 2: Construire des maps pour la symétrie
    const sentAccepted = new Map();
    const receivedAccepted = new Map();

    (sentResult.data || []).forEach((relation) => {
      if (relation?.contact?.id) {
        sentAccepted.set(relation.contact.id, relation);
      }
    });

    (receivedResult.data || []).forEach((relation) => {
      if (relation?.sender?.id) {
        receivedAccepted.set(relation.sender.id, relation);
      }
    });

    // Étape 3: Ne garder que les amis mutuels (symétrie)
    const mutualIds = Array.from(sentAccepted.keys()).filter((id) =>
      receivedAccepted.has(id)
    );

    const contactsList = mutualIds.map((id) => {
      const s = sentAccepted.get(id);
      const r = receivedAccepted.get(id);
      const name = s?.contact?.name || r?.sender?.name || "Utilisateur";
      const avatar = s?.contact?.avatar || r?.sender?.avatar;

      // Choisir la dernière interaction la plus récente
      const lastInteractions = [s?.last_interaction, r?.last_interaction]
        .filter(Boolean)
        .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

      const lastActivity = lastInteractions[0]
        ? formatLastActivity(lastInteractions[0])
        : "Jamais";

      return {
        id,
        name,
        avatar,
        lastActivity,
      };
    });

    const duration = Date.now() - start;
    req.log.info(
      { duration, count: contactsList.length },
      "getContacts completed"
    );

    res.json({
      contacts: contactsList,
      count: contactsList.length,
    });
  } catch (error) {
    req.log.error({ error: error.message }, "Error in getContacts");
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// DÉMARRAGE DU SERVEUR
// ============================================
app.listen(PORT, () => {
  console.log(
    `🚀 Exporteur de métriques Unify démarré sur http://localhost:${PORT}`
  );
  console.log(`📊 Métriques Prometheus sur http://localhost:${PORT}/metrics`);
  console.log(`💚 Health check sur http://localhost:${PORT}/health`);
});
