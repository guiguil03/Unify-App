import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getEnv } from '../utils/env';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Storage adapter using expo-secure-store for native, localStorage for web
const SecureStoreAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    }
    return SecureStore.getItemAsync(key);
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
      return;
    }
    await SecureStore.setItemAsync(key, value);
  },
  removeItem: async (key: string): Promise<void> => {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
      return;
    }
    await SecureStore.deleteItemAsync(key);
  },
};

// Configuration Supabase - fallbacks hardcodés pour éviter un crash module-level en production
const supabaseUrl = getEnv('SUPABASE_URL', 'https://muhexuopzmqdxonurktn.supabase.co');
const supabaseAnonKey = getEnv('SUPABASE_API_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11aGV4dW9wem1xZHhvbnVya3RuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0NTYyMzMsImV4cCI6MjA3ODAzMjIzM30.Q9c9BDzB1NeLOftXq4A9aqDM3bltWwcEL_LNJNxM3JI');

// Créer le client Supabase avec SecureStore pour la persistance sécurisée
let supabaseClient: SupabaseClient | null = null;

function initializeSupabase(): SupabaseClient {
  if (supabaseClient) {
    return supabaseClient;
  }

  supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: SecureStoreAdapter,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  });

  return supabaseClient;
}

// Initialiser immédiatement
const supabase = initializeSupabase();

export { supabase };
export default supabase;
