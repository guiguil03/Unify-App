import { Location } from './location/LocationService';
import { Runner } from '../types/runner';
import { supabase } from '../config/supabase';
import { getCurrentUserFromDB } from '../utils/supabaseHelpers';

export class RunnersService {
  /**
   * Calcule la distance entre deux points (formule de Haversine)
   */
  private static calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
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
   * Récupère les coureurs actifs à proximité
   */
  static async getNearbyRunners(
    currentLocation: Location,
    radiusKm: number = 5
  ): Promise<Runner[]> {
    try {
      const currentUser = await getCurrentUserFromDB();
      const currentUserId = currentUser?.id;

      // Récupérer tous les coureurs actifs
      const { data, error } = await supabase
        .from('runners')
        .select(`
          *,
          user:users!runners_user_id_fkey(id, name, avatar, bio)
        `)
        .eq('is_active', true);

      if (error) {
        console.error('Erreur lors de la récupération des coureurs:', error);
        throw error;
      }

      // Filtrer par distance et exclure l'utilisateur actuel
      const nearbyRunners = (data || [])
        .filter((runner: any) => runner.user_id !== currentUserId)
        .map((runner: any) => {
          const distance = this.calculateDistance(
            currentLocation.latitude,
            currentLocation.longitude,
            Number(runner.latitude),
            Number(runner.longitude)
          );
          return { ...runner, calculatedDistance: distance };
        })
        .filter((runner: any) => runner.calculatedDistance <= radiusKm)
        .sort((a: any, b: any) => a.calculatedDistance - b.calculatedDistance)
        .slice(0, 20); // Limiter à 20 résultats

      return nearbyRunners.map((runner: any) => ({
        id: runner.user_id,
        name: runner.user.name,
        location: {
          latitude: Number(runner.latitude),
          longitude: Number(runner.longitude),
        },
        distance: runner.calculatedDistance,
        pace: runner.pace || '',
        avatar: runner.user.avatar,
        bio: runner.user.bio,
      }));
    } catch (error) {
      console.error('Erreur dans getNearbyRunners:', error);
      throw error;
    }
  }

  /**
   * Met à jour la position du coureur actuel
   */
  static async updateRunnerPosition(position: {
    latitude: number;
    longitude: number;
    distance?: number;
    pace?: string;
    paceSeconds?: number;
    isActive?: boolean;
    activityId?: string;
  }): Promise<void> {
    try {
      const currentUser = await getCurrentUserFromDB();
      if (!currentUser) {
        throw new Error('Utilisateur non authentifié');
      }

      const { error } = await supabase
        .from('runners')
        .upsert(
          {
            user_id: currentUser.id,
            latitude: position.latitude,
            longitude: position.longitude,
            distance: position.distance,
            pace: position.pace,
            pace_seconds: position.paceSeconds,
            is_active: position.isActive ?? true,
            activity_id: position.activityId,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'user_id',
          }
        );

      if (error) throw error;
    } catch (error) {
      console.error('Erreur dans updateRunnerPosition:', error);
      throw error;
    }
  }

  /**
   * Désactive la position du coureur (quand il arrête de courir)
   */
  static async deactivateRunner(): Promise<void> {
    try {
      const currentUser = await getCurrentUserFromDB();
      if (!currentUser) {
        throw new Error('Utilisateur non authentifié');
      }

      const { error } = await supabase
        .from('runners')
        .update({
          is_active: false,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', currentUser.id);

      if (error) throw error;
    } catch (error) {
      console.error('Erreur dans deactivateRunner:', error);
      throw error;
    }
  }
}