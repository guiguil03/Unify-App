#!/usr/bin/env node

/**
 * Script de seed pour la base de données Unify
 * Crée des données de test reproductibles pour les tests de performance
 */

const { createClient } = require("@supabase/supabase-js");

// Configuration Supabase
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("❌ Variables SUPABASE_URL et SUPABASE_SERVICE_KEY requises");
  console.log(
    "Usage: SUPABASE_URL=xxx SUPABASE_SERVICE_KEY=xxx node seed-database.js"
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Villes françaises avec coordonnées (pour distribuer les utilisateurs)
const CITIES = [
  { name: "Paris", lat: 48.8566, lon: 2.3522 },
  { name: "Lyon", lat: 45.764, lon: 4.8357 },
  { name: "Marseille", lat: 43.2965, lon: 5.3698 },
  { name: "Toulouse", lat: 43.6047, lon: 1.4442 },
  { name: "Nice", lat: 43.7102, lon: 7.262 },
  { name: "Nantes", lat: 47.2184, lon: -1.5536 },
  { name: "Bordeaux", lat: 44.8378, lon: -0.5792 },
  { name: "Lille", lat: 50.6292, lon: 3.0573 },
];

// Générer une position aléatoire autour d'une ville (rayon ~10km)
function randomPosition(city) {
  const radiusKm = 10;
  const radiusDeg = radiusKm / 111; // Approximation 1 degré ≈ 111km

  const lat = city.lat + (Math.random() - 0.5) * 2 * radiusDeg;
  const lon = city.lon + (Math.random() - 0.5) * 2 * radiusDeg;

  return { lat, lon };
}

// Noms et avatars aléatoires
const FIRST_NAMES = [
  "Alice",
  "Bob",
  "Charlie",
  "Diana",
  "Emma",
  "Frank",
  "Grace",
  "Hugo",
  "Iris",
  "Jack",
  "Kate",
  "Liam",
  "Marie",
  "Noah",
  "Olivia",
  "Paul",
  "Quinn",
  "Rose",
  "Sam",
  "Tom",
];
const LAST_NAMES = [
  "Martin",
  "Bernard",
  "Dubois",
  "Thomas",
  "Robert",
  "Richard",
  "Petit",
  "Durand",
  "Leroy",
  "Moreau",
];

function randomName() {
  const first = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
  const last = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
  return `${first} ${last}`;
}

function randomEmail(name) {
  return `${name.toLowerCase().replace(" ", ".")}@test-perf.unify.app`;
}

async function cleanDatabase() {
  console.log("🧹 Nettoyage de la base...");

  // Supprimer dans l'ordre inverse des foreign keys
  const tables = [
    "story_views",
    "stories",
    "activity_routes",
    "activity_pauses",
    "event_participants",
    "events",
    "chat_messages",
    "conversations",
    "contacts",
    "runners",
    "activities",
    "user_settings",
    "users",
  ];

  for (const table of tables) {
    try {
      const { error } = await supabase
        .from(table)
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000"); // Delete all

      if (error) {
        console.warn(
          `⚠️  Erreur lors du nettoyage de ${table}:`,
          error.message
        );
      } else {
        console.log(`  ✓ Table ${table} nettoyée`);
      }
    } catch (err) {
      console.warn(`⚠️  Erreur lors du nettoyage de ${table}:`, err.message);
    }
  }
}

async function seedUsers(count = 100) {
  console.log(`\n👥 Création de ${count} utilisateurs...`);

  const users = [];

  for (let i = 0; i < count; i++) {
    const city = CITIES[Math.floor(Math.random() * CITIES.length)];
    const pos = randomPosition(city);
    const name = randomName();

    users.push({
      name,
      email: randomEmail(name) + `-${i}`, // Unicité garantie
      avatar: `https://i.pravatar.cc/150?img=${i % 70}`,
      bio: `Coureur passionné à ${city.name}`,
      gender: Math.random() > 0.5 ? "male" : "female",
      level: ["beginner", "intermediate", "advanced"][
        Math.floor(Math.random() * 3)
      ],
      last_latitude: pos.lat,
      last_longitude: pos.lon,
      total_distance: Math.floor(Math.random() * 500),
      sessions: Math.floor(Math.random() * 100),
      average_pace: `${5 + Math.floor(Math.random() * 3)}:${String(Math.floor(Math.random() * 60)).padStart(2, "0")}`,
    });
  }

  // Insérer par batch de 50
  for (let i = 0; i < users.length; i += 50) {
    const batch = users.slice(i, i + 50);
    const { data, error } = await supabase
      .from("users")
      .insert(batch)
      .select("id");

    if (error) {
      console.error("❌ Erreur lors de la création des utilisateurs:", error);
      throw error;
    }

    console.log(
      `  ✓ Batch ${Math.floor(i / 50) + 1}/${Math.ceil(users.length / 50)} créé`
    );
  }

  console.log(`✅ ${count} utilisateurs créés`);
}

async function seedRunners(count = 50) {
  console.log(`\n🏃 Création de ${count} runners actifs...`);

  // Récupérer des utilisateurs aléatoires
  const { data: users, error: usersError } = await supabase
    .from("users")
    .select("id, last_latitude, last_longitude")
    .limit(count);

  if (usersError) {
    console.error("❌ Erreur:", usersError);
    throw usersError;
  }

  const runners = users.map((user) => ({
    user_id: user.id,
    latitude: user.last_latitude,
    longitude: user.last_longitude,
    distance: Math.floor(Math.random() * 10 + 1), // 1-10 km
    pace: `${5 + Math.floor(Math.random() * 3)}:${String(Math.floor(Math.random() * 60)).padStart(2, "0")}`,
    pace_seconds: 300 + Math.floor(Math.random() * 120), // 5-7 min/km en secondes
    is_active: Math.random() > 0.3, // 70% actifs
  }));

  const { error } = await supabase.from("runners").insert(runners);

  if (error) {
    console.error("❌ Erreur:", error);
    throw error;
  }

  console.log(`✅ ${count} runners créés`);
}

async function seedActivities(count = 300) {
  console.log(`\n📊 Création de ${count} activités...`);

  // Récupérer tous les utilisateurs
  const { data: users, error: usersError } = await supabase
    .from("users")
    .select("id");

  if (usersError) {
    console.error("❌ Erreur:", usersError);
    throw usersError;
  }

  const activities = [];

  for (let i = 0; i < count; i++) {
    const user = users[Math.floor(Math.random() * users.length)];
    const distance = 3 + Math.random() * 20; // 3-23 km
    const paceSeconds = 300 + Math.floor(Math.random() * 120); // 5-7 min/km
    const durationSeconds = Math.floor(distance * paceSeconds);

    const paceMinutes = Math.floor(paceSeconds / 60);
    const paceSecondsRem = paceSeconds % 60;
    const durationMinutes = Math.floor(durationSeconds / 60);

    activities.push({
      user_id: user.id,
      date: new Date(
        Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000
      ).toISOString(), // Derniers 30 jours
      distance: distance.toFixed(2),
      duration: `${durationMinutes} min`,
      duration_seconds: durationSeconds,
      pace: `${paceMinutes}:${String(paceSecondsRem).padStart(2, "0")}`,
      pace_seconds: paceSeconds,
      title: ["Morning Run", "Evening Jog", "Training", "Long Run"][
        Math.floor(Math.random() * 4)
      ],
      feeling: ["excellent", "good", "ok", "tough"][
        Math.floor(Math.random() * 4)
      ],
    });
  }

  // Insérer par batch de 100
  for (let i = 0; i < activities.length; i += 100) {
    const batch = activities.slice(i, i + 100);
    const { error } = await supabase.from("activities").insert(batch);

    if (error) {
      console.error("❌ Erreur:", error);
      throw error;
    }

    console.log(
      `  ✓ Batch ${Math.floor(i / 100) + 1}/${Math.ceil(activities.length / 100)} créé`
    );
  }

  console.log(`✅ ${count} activités créées`);
}

async function seedContacts(count = 200) {
  console.log(
    `\n👥 Création de ${count} relations de contacts (amis mutuels)...`
  );

  // Récupérer tous les utilisateurs
  const { data: users, error: usersError } = await supabase
    .from("users")
    .select("id");

  if (usersError) {
    console.error("❌ Erreur:", usersError);
    throw usersError;
  }

  const contacts = [];
  const createdPairs = new Set();

  // Créer des relations mutuelles (amis bidirectionnels)
  for (let i = 0; i < count; i++) {
    const user1 = users[Math.floor(Math.random() * users.length)];
    const user2 = users[Math.floor(Math.random() * users.length)];

    // Éviter les doublons et les self-contacts
    if (user1.id === user2.id) continue;

    const pairKey = [user1.id, user2.id].sort().join("-");
    if (createdPairs.has(pairKey)) continue;

    createdPairs.add(pairKey);

    // Créer les deux directions (symétrie)
    contacts.push({
      user_id: user1.id,
      contact_id: user2.id,
      status: "accepted",
      last_interaction: new Date(
        Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000
      ).toISOString(),
    });

    contacts.push({
      user_id: user2.id,
      contact_id: user1.id,
      status: "accepted",
      last_interaction: new Date(
        Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000
      ).toISOString(),
    });
  }

  // Insérer par batch de 100
  for (let i = 0; i < contacts.length; i += 100) {
    const batch = contacts.slice(i, i + 100);
    const { error } = await supabase.from("contacts").insert(batch);

    if (error) {
      console.error("❌ Erreur:", error);
      throw error;
    }

    console.log(
      `  ✓ Batch ${Math.floor(i / 100) + 1}/${Math.ceil(contacts.length / 100)} créé`
    );
  }

  console.log(
    `✅ ${contacts.length} relations créées (${createdPairs.size} paires d'amis mutuels)`
  );
}

async function main() {
  console.log("🌱 SEED DATABASE - Unify Performance Testing\n");
  console.log(`📍 Supabase URL: ${SUPABASE_URL}`);
  console.log("");

  try {
    // Nettoyer
    await cleanDatabase();

    // Seeder
    await seedUsers(100); // 100 utilisateurs avec positions
    await seedRunners(50); // 50 runners actifs
    await seedActivities(300); // 300 activités
    await seedContacts(200); // ~200 relations mutuelles

    console.log("\n✅ SEED TERMINÉ AVEC SUCCÈS!\n");
    console.log("📊 Données créées:");
    console.log("  - 100 utilisateurs avec positions géographiques");
    console.log("  - 50 runners actifs");
    console.log("  - 300 activités de course");
    console.log("  - ~200 paires d'amis mutuels");
    console.log("\n🚀 Vous pouvez maintenant lancer les tests k6!");
  } catch (error) {
    console.error("\n❌ ERREUR LORS DU SEED:", error);
    process.exit(1);
  }
}

main();
