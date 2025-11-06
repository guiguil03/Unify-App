import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getEnv } from '../utils/env';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configuration Supabase depuis les variables d'environnement
const supabaseUrl = getEnv('SUPABASE_URL', 'https://muhexuopzmqdxonurktn.supabase.co');
const supabaseAnonKey = getEnv('SUPABASE_API_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11aGV4dW9wem1xZHhvbnVya3RuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0NTYyMzMsImV4cCI6MjA3ODAzMjIzM30.Q9c9BDzB1NeLOftXq4A9aqDM3bltWwcEL_LNJNxM3JI');

console.log('🔧 Initialisation du client Supabase...');
console.log('📍 URL:', supabaseUrl);

// Créer le client Supabase avec AsyncStorage pour la persistance
let supabaseClient: SupabaseClient | null = null;

function initializeSupabase(): SupabaseClient {
  if (supabaseClient) {
    return supabaseClient;
  }

  try {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: AsyncStorage,
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    });

    // Vérifier que le client est bien initialisé
    if (!supabaseClient) {
      throw new Error('Le client Supabase est null');
    }

    if (!supabaseClient.auth) {
      throw new Error('La propriété auth du client Supabase n\'existe pas');
    }

    console.log('✅ Client Supabase initialisé avec succès!');
    console.log('✅ Auth disponible:', !!supabaseClient.auth);
    return supabaseClient;
  } catch (error: any) {
    console.error('❌ ERREUR lors de l\'initialisation de Supabase:', error);
    console.error('❌ Détails:', error?.message || error);
    throw new Error(`Erreur d'initialisation Supabase: ${error?.message || error}`);
  }
}

// Initialiser immédiatement
const supabase = initializeSupabase();

export { supabase };
export default supabase;

