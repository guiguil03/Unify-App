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

// Configuration Supabase - les variables d'environnement sont obligatoires
const supabaseUrl = getEnv('SUPABASE_URL');
const supabaseAnonKey = getEnv('SUPABASE_API_KEY');

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
