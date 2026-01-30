import { Location } from './location/LocationService';
import { Runner } from '../types/runner';
import { supabase } from '../config/supabase';
import { getCurrentUserFromDB } from '../utils/supabaseHelpers';
import { RealtimeChannel } from '@supabase/supabase-js';

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
   * Récupère tous les utilisateurs à proximité (pas seulement ceux qui courent)
   */
  static async getNearbyRunners(
    currentLocation: Location,
    radiusKm: number = 5
  ): Promise<Runner[]> {
    try {
      const currentUser = await getCurrentUserFromDB();
      const currentUserId = currentUser?.id;

      // Récupérer tous les utilisateurs avec leur dernière position connue
      const { data, error } = await supabase
        .from('users')
        .select(`
          id,
          name,
          avatar,
          bio,
          gender,
          average_pace,
          preferred_time,
          last_latitude,
          last_longitude,
          updated_at
        `)
        .not('last_latitude', 'is', null)
        .not('last_longitude', 'is', null);

      if (error) {
        console.error('Erreur lors de la récupération des utilisateurs:', error);
        throw error;
      }

      // Filtrer par distance et exclure l'utilisateur actuel
      const nearbyUsers = (data || [])
        .filter((user: any) => {
          // Exclure l'utilisateur actuel
          if (user.id === currentUserId) return false;
          return true;
        })
        .map((user: any) => {
          const distance = this.calculateDistance(
            currentLocation.latitude,
            currentLocation.longitude,
            Number(user.last_latitude),
            Number(user.last_longitude)
          );
          return { ...user, calculatedDistance: distance };
        })
        .filter((user: any) => user.calculatedDistance <= radiusKm)
        .sort((a: any, b: any) => a.calculatedDistance - b.calculatedDistance)
        .slice(0, 50); // Limiter à 50 résultats

      // Récupérer les infos d'activité pour savoir qui court actuellement
      const userIds = nearbyUsers.map((u: any) => u.id);
      const { data: runnersData } = await supabase
        .from('runners')
        .select('user_id, is_active, pace, distance, updated_at')
        .in('user_id', userIds);

      const runnersMap = new Map(
        (runnersData || []).map((r: any) => [r.user_id, r])
      );

      return nearbyUsers.map((user: any) => {
        const runnerInfo = runnersMap.get(user.id);
        return {
          id: user.id,
          name: user.name || 'Utilisateur inconnu',
          location: {
            latitude: Number(user.last_latitude),
            longitude: Number(user.last_longitude),
          },
          distance: user.calculatedDistance,
          pace: runnerInfo?.pace || '',
          avatar: user.avatar,
          bio: user.bio,
          isActive: runnerInfo?.is_active || false,
          lastSeen: runnerInfo?.updated_at || user.updated_at,
          gender: user.gender,
          averagePace: user.average_pace,
          preferredTime: user.preferred_time,
        };
      });
    } catch (error) {
      console.error('Erreur dans getNearbyRunners:', error);
      throw error;
    }
  }

  /**
   * Met à jour la position de l'utilisateur (pour être visible sur la carte)
   */
  static async updateUserLocation(position: {
    latitude: number;
    longitude: number;
  }): Promise<void> {
    try {
      const currentUser = await getCurrentUserFromDB();
      if (!currentUser) {
        console.error('❌ Utilisateur non authentifié');
        throw new Error('Utilisateur non authentifié');
      }

      // Mettre à jour la position dans la table users
      const { error } = await supabase
        .from('users')
        .update({
          last_latitude: position.latitude,
          last_longitude: position.longitude,
          updated_at: new Date().toISOString(),
        })
        .eq('id', currentUser.id);

      if (error) {
        console.error('❌ Erreur lors de la mise à jour de la position:', error);
        throw error;
      }

      console.log('✅ Position utilisateur mise à jour:', position);
    } catch (error) {
      console.error('❌ Erreur dans updateUserLocation:', error);
      throw error;
    }
  }

  /**
   * Met à jour la position du coureur actuel (pendant une activité)
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
      console.log('🔄 updateRunnerPosition appelé avec:', position);
      const currentUser = await getCurrentUserFromDB();
      if (!currentUser) {
        console.error('❌ Utilisateur non authentifié');
        throw new Error('Utilisateur non authentifié');
      }

      console.log('✅ Utilisateur trouvé:', currentUser.id);

      // Mettre à jour la table runners (pour l'activité en cours)
      const dataToUpsert = {
        user_id: currentUser.id,
        latitude: position.latitude,
        longitude: position.longitude,
        distance: position.distance,
        pace: position.pace,
        pace_seconds: position.paceSeconds,
        is_active: position.isActive ?? true,
        activity_id: position.activityId,
        updated_at: new Date().toISOString(),
      };

      console.log('📤 Données à insérer/mettre à jour:', dataToUpsert);

      const { data, error } = await supabase
        .from('runners')
        .upsert(
          dataToUpsert,
          {
            onConflict: 'user_id',
          }
        )
        .select();

      if (error) {
        console.error('❌ Erreur Supabase:', error);
        throw error;
      }

      // Aussi mettre à jour la position dans users
      await this.updateUserLocation({
        latitude: position.latitude,
        longitude: position.longitude,
      });

      console.log('✅ Position du coureur mise à jour avec succès:', data);
    } catch (error) {
      console.error('❌ Erreur dans updateRunnerPosition:', error);
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

  /**
   * S'abonner aux changements en temps réel des positions utilisateurs
   */
  static subscribeToRunners(
    callback: (runners: any[]) => void
  ): RealtimeChannel {
    
    const channel = supabase
      .channel('users-location-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE', // Seulement les mises à jour de position
          schema: 'public',
          table: 'users',
          filter: 'last_latitude=not.is.null', // Seulement si la position existe
        },
        (payload) => {
          // Déclencher le callback pour recharger les données
          callback([]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*', // Tous les changements dans runners (activités)
          schema: 'public',
          table: 'runners',
        },
        (payload) => {
          // Déclencher le callback pour recharger les données
          callback([]);
        }
      )
      

    return channel;
  }

  /**
   * Se désabonner des changements en temps réel
   */
  static unsubscribeFromRunners(channel: RealtimeChannel): void {
    supabase.removeChannel(channel);
  }
}