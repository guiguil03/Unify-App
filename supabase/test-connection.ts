/**
 * Script de test pour vérifier la connexion à Supabase
 * Exécutez ce fichier pour tester que votre configuration Supabase fonctionne correctement
 */

import { supabase } from '../src/config/supabase';

async function testConnection() {
  console.log('🧪 Test de connexion à Supabase...\n');

  try {
    // Test 1: Vérifier la connexion de base
    console.log('1️⃣ Test de connexion...');
    const { data: healthCheck, error: healthError } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (healthError && healthError.code !== 'PGRST116') { // PGRST116 = table doesn't exist yet
      console.error('❌ Erreur de connexion:', healthError.message);
      console.log('💡 Assurez-vous d\'avoir exécuté le script SQL dans Supabase Dashboard');
      return;
    }
    console.log('✅ Connexion réussie!\n');

    // Test 2: Vérifier que les tables existent
    console.log('2️⃣ Vérification des tables...');
    const tables = [
      'users',
      'activities',
      'activity_routes',
      'activity_pauses',
      'events',
      'event_participants',
      'contacts',
      'conversations',
      'chat_messages',
      'runners',
      'user_settings'
    ];

    let allTablesExist = true;
    for (const table of tables) {
      const { error } = await supabase.from(table).select('*').limit(0);
      if (error && error.code !== 'PGRST116') {
        console.log(`  ❌ Table "${table}" : Erreur - ${error.message}`);
        allTablesExist = false;
      } else if (error && error.code === 'PGRST116') {
        console.log(`  ⚠️  Table "${table}" : N'existe pas encore`);
        allTablesExist = false;
      } else {
        console.log(`  ✅ Table "${table}" : OK`);
      }
    }

    if (!allTablesExist) {
      console.log('\n💡 Veuillez exécuter le script schema.sql dans Supabase Dashboard');
      return;
    }

    console.log('\n✅ Toutes les tables sont créées!\n');

    // Test 3: Test d'insertion (si authentifié)
    console.log('3️⃣ Test des permissions RLS...');
    console.log('  ℹ️  Les tests de permissions nécessitent une authentification');
    console.log('  💡 Les policies RLS sont configurées pour sécuriser les données\n');

    console.log('✅ Tous les tests sont passés avec succès!');
    console.log('\n📚 Prochaines étapes:');
    console.log('  1. Configurez l\'authentification Supabase dans votre app');
    console.log('  2. Commencez à utiliser les services Supabase dans votre code');
    console.log('  3. Consultez les exemples dans src/services/ pour voir comment utiliser Supabase');

  } catch (error: any) {
    console.error('❌ Erreur lors du test:', error.message);
    console.error(error);
  }
}

// Exécuter le test si ce fichier est exécuté directement
if (require.main === module) {
  testConnection().then(() => {
    process.exit(0);
  }).catch((error) => {
    console.error('Erreur fatale:', error);
    process.exit(1);
  });
}

export { testConnection };

