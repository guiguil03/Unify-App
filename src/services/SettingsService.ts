import { Settings } from '../types/settings';
import { supabase } from '../config/supabase';
import { getCurrentUserFromDB } from '../utils/supabaseHelpers';

// Cache 60s — évite un aller-retour DB à chaque retour sur la carte
let _cache: { data: Settings; ts: number } | null = null;
const CACHE_TTL = 60_000;

export class SettingsService {
  static invalidateCache() { _cache = null; }

  /**
   * Récupère les paramètres de l'utilisateur actuel
   */
  static async getSettings(): Promise<Settings | null> {
    if (_cache && Date.now() - _cache.ts < CACHE_TTL) return _cache.data;
    try {
      const currentUser = await getCurrentUserFromDB();
      if (!currentUser) {
        throw new Error('Utilisateur non authentifié');
      }

      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', currentUser.id)
        .single();

      if (error) {
        // Si les paramètres n'existent pas, créer des paramètres par défaut
        if (error.code === 'PGRST116') {
          return this.createDefaultSettings(currentUser.id);
        }
        throw error;
      }

      const result: Settings = {
        sameGenderOnly: data.same_gender_only || false,
        hideExactLocation: data.hide_exact_location || false,
        similarPaceOnly: data.similar_pace_only || false,
        similarSchedule: data.similar_schedule || false,
        nearbyRunnersNotifications: data.nearby_runners_notifications ?? true,
      };
      _cache = { data: result, ts: Date.now() };
      return result;
    } catch (error) {
      if (__DEV__) console.error('Settings load failed:', error);
      return null;
    }
  }

  /**
   * Sauvegarde les paramètres de l'utilisateur
   */
  static async saveSettings(settings: Settings): Promise<boolean> {
    _cache = { data: settings, ts: Date.now() }; // Mise à jour optimiste du cache
    try {
      const currentUser = await getCurrentUserFromDB();
      if (!currentUser) {
        throw new Error('Utilisateur non authentifié');
      }

      const { error } = await supabase
        .from('user_settings')
        .upsert(
          {
            user_id: currentUser.id,
            same_gender_only: settings.sameGenderOnly,
            hide_exact_location: settings.hideExactLocation,
            similar_pace_only: settings.similarPaceOnly,
            similar_schedule: settings.similarSchedule,
            nearby_runners_notifications: settings.nearbyRunnersNotifications,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'user_id',
          }
        );

      if (error) {
        return false;
      }

      return true;
    } catch (error) {
      if (__DEV__) console.error('Settings save failed:', error);
      return false;
    }
  }

  /**
   * Crée des paramètres par défaut pour un utilisateur
   */
  private static async createDefaultSettings(userId: string): Promise<Settings> {
    const defaultSettings: Settings = {
      sameGenderOnly: false,
      hideExactLocation: false,
      similarPaceOnly: false,
      similarSchedule: false,
      nearbyRunnersNotifications: true,
    };

    const { error } = await supabase.from('user_settings').insert({
      user_id: userId,
      ...defaultSettings,
    });

    if (error) {
      // Silently ignore default settings creation error
    }

    return defaultSettings;
  }
}