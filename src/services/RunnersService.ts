import { Location } from '../types/location';
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

      // Mapper les utilisateurs en runners avec leurs infos d'activité
      const runners = nearbyUsers.map((user: any) => {
        const runnerInfo = runnersMap.get(user.id);
        const lastSeen = runnerInfo?.updated_at || user.updated_at;
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
          lastSeen: lastSeen,
          gender: user.gender,
          averagePace: user.average_pace,
          preferredTime: user.preferred_time,
        };
      });

      // Trier par dernière connexion : actifs d'abord, puis par date de dernière activité (plus récent en premier)
      return runners.sort((a, b) => {
        // Les coureurs actifs en premier
        if (a.isActive && !b.isActive) return -1;
        if (!a.isActive && b.isActive) return 1;
        
        // Si les deux sont actifs ou inactifs, trier par dernière activité
        const dateA = a.lastSeen ? new Date(a.lastSeen).getTime() : 0;
        const dateB = b.lastSeen ? new Date(b.lastSeen).getTime() : 0;
        
        // Plus récent en premier (dateB - dateA pour ordre décroissant)
        return dateB - dateA;
      });
    } catch (error) {
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
        throw error;
      }
    } catch (error) {
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
      const currentUser = await getCurrentUserFromDB();
      if (!currentUser) {
        throw new Error('Utilisateur non authentifié');
      }

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
        throw error;
      }

      // Aussi mettre à jour la position dans users
      await this.updateUserLocation({
        latitude: position.latitude,
        longitude: position.longitude,
      });

    } catch (error) {
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
      .subscribe();

    return channel;
  }

  /**
   * Se désabonner des changements en temps réel
   */
  static unsubscribeFromRunners(channel: RealtimeChannel): void {
    supabase.removeChannel(channel);
  }
}