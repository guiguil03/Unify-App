// src/services/ActivitiesService.ts
import { Activity, ActivityRoute } from '../types/activity';
import { supabase } from '../config/supabase';
import { getCurrentUserFromDB, formatDate } from '../utils/supabaseHelpers';

export class ActivitiesService {
  /**
   * Récupère toutes les activités de l'utilisateur actuel
   */
  static async getActivities(): Promise<Activity[]> {
    try {
      const currentUser = await getCurrentUserFromDB();
      if (!currentUser) {
        throw new Error('Utilisateur non authentifié');
      }

      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('date', { ascending: false });

      if (error) {
        console.error('Erreur lors de la récupération des activités:', error);
        throw error;
      }

      // Transformer les données au format Activity
      return (data || []).map((activity) => ({
        id: activity.id,
        date: formatDate(activity.date),
        distance: Number(activity.distance),
        duration: activity.duration,
        pace: activity.pace,
      }));
    } catch (error: any) {
      // Ne pas logger les erreurs d'authentification
      if (!error?.message?.includes('Utilisateur non authentifié')) {
        console.error('Erreur dans getActivities:', error);
      }
      throw error;
    }
  }

  /**
   * Récupère une activité avec sa route complète
   */
  static async getActivityById(activityId: string): Promise<Activity & { route?: ActivityRoute }> {
    try {
      // Récupérer l'activité
      const { data: activity, error: activityError } = await supabase
        .from('activities')
        .select('*')
        .eq('id', activityId)
        .single();

      if (activityError) throw activityError;
      if (!activity) throw new Error('Activité non trouvée');

      // Récupérer la route
      const { data: routePoints } = await supabase
        .from('activity_routes')
        .select('*')
        .eq('activity_id', activityId)
        .order('timestamp', { ascending: true });

      // Récupérer les pauses
      const { data: pauses } = await supabase
        .from('activity_pauses')
        .select('*')
        .eq('activity_id', activityId)
        .order('start_time', { ascending: true });

      const route: ActivityRoute | undefined = routePoints && routePoints.length > 0
        ? {
            coordinates: routePoints.map((point) => ({
              latitude: Number(point.latitude),
              longitude: Number(point.longitude),
              timestamp: point.timestamp,
            })),
            pauses: (pauses || []).map((pause) => ({
              startTime: pause.start_time,
              endTime: pause.end_time,
              location: {
                latitude: Number(pause.latitude),
                longitude: Number(pause.longitude),
              },
            })),
          }
        : undefined;

      return {
        id: activity.id,
        date: formatDate(activity.date),
        distance: Number(activity.distance),
        duration: activity.duration,
        pace: activity.pace,
        route,
      };
    } catch (error) {
      console.error('Erreur dans getActivityById:', error);
      throw error;
    }
  }

  /**
   * Crée une nouvelle activité
   */
  static async createActivity(activityData: {
    distance: number;
    duration: string;
    durationSeconds?: number;
    pace: string;
    paceSeconds?: number;
    title?: string;
    notes?: string;
    date?: string;
  }): Promise<Activity> {
    try {
      const currentUser = await getCurrentUserFromDB();
      if (!currentUser) {
        throw new Error('Utilisateur non authentifié');
      }

      const { data, error } = await supabase
        .from('activities')
        .insert({
          user_id: currentUser.id,
          distance: activityData.distance,
          duration: activityData.duration,
          duration_seconds: activityData.durationSeconds,
          pace: activityData.pace,
          pace_seconds: activityData.paceSeconds,
          title: activityData.title,
          notes: activityData.notes,
          date: activityData.date || new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        date: formatDate(data.date),
        distance: Number(data.distance),
        duration: data.duration,
        pace: data.pace,
      };
    } catch (error) {
      console.error('Erreur dans createActivity:', error);
      throw error;
    }
  }

  /**
   * Ajoute des points de route à une activité
   */
  static async addRoutePoints(
    activityId: string,
    points: Array<{
      latitude: number;
      longitude: number;
      timestamp: number;
      altitude?: number;
      accuracy?: number;
      speed?: number;
    }>
  ): Promise<void> {
    try {
      const routeData = points.map((point) => ({
        activity_id: activityId,
        latitude: point.latitude,
        longitude: point.longitude,
        timestamp: point.timestamp,
        altitude: point.altitude,
        accuracy: point.accuracy,
        speed: point.speed,
      }));

      const { error } = await supabase
        .from('activity_routes')
        .insert(routeData);

      if (error) throw error;
    } catch (error) {
      console.error('Erreur dans addRoutePoints:', error);
      throw error;
    }
  }

  /**
   * Ajoute des pauses à une activité
   */
  static async addPauses(
    activityId: string,
    pauses: Array<{
      startTime: number;
      endTime: number;
      latitude: number;
      longitude: number;
      reason?: string;
    }>
  ): Promise<void> {
    try {
      const pauseData = pauses.map((pause) => ({
        activity_id: activityId,
        start_time: pause.startTime,
        end_time: pause.endTime,
        latitude: pause.latitude,
        longitude: pause.longitude,
        reason: pause.reason,
      }));

      const { error } = await supabase
        .from('activity_pauses')
        .insert(pauseData);

      if (error) throw error;
    } catch (error) {
      console.error('Erreur dans addPauses:', error);
      throw error;
    }
  }

  /**
   * Supprime une activité
   */
  static async deleteActivity(activityId: string): Promise<void> {
    try {
      const currentUser = await getCurrentUserFromDB();
      if (!currentUser) {
        throw new Error('Utilisateur non authentifié');
      }

      const { error } = await supabase
        .from('activities')
        .delete()
        .eq('id', activityId)
        .eq('user_id', currentUser.id);

      if (error) throw error;
    } catch (error) {
      console.error('Erreur dans deleteActivity:', error);
      throw error;
    }
  }
}