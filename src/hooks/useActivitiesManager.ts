import { useState } from 'react';
import { Activity } from '../types/activity';
import { ActivitiesService } from '../services/ActivitiesService';
import { ProfileService } from '../services/ProfileService';
import { useActivities } from './useActivities';
import { updateUserProfileStats, calculateNewStats } from '../utils/profileStats';
import { getCurrentUserFromDB } from '../utils/supabaseHelpers';

export function useActivitiesManager() {
  const { activities, loading, error, refetch } = useActivities();
  const [isAdding, setIsAdding] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  /**
   * Ajoute une nouvelle activité dans Supabase
   */
  const addActivity = async (activity: {
    distance: number;
    duration: string;
    date?: string;
    title?: string;
    notes?: string;
    route?: Activity['route'];
  }) => {
    try {
      setIsAdding(true);

      // Convertir la durée en secondes si nécessaire
      const durationSeconds = parseDurationToSeconds(activity.duration);
      
      // Calculer l'allure en secondes
      const paceSeconds = activity.distance > 0 
        ? Math.round(durationSeconds / activity.distance) 
        : 0;

      // Formater l'allure
      const paceMinutes = Math.floor(paceSeconds / 60);
      const paceSecs = paceSeconds % 60;
      const paceFormatted = `${paceMinutes}:${paceSecs.toString().padStart(2, '0')} min/km`;

      // Créer l'activité dans Supabase
      const newActivity = await ActivitiesService.createActivity({
        distance: activity.distance,
        duration: activity.duration,
        durationSeconds: durationSeconds,
        pace: paceFormatted,
        paceSeconds: paceSeconds,
        title: activity.title,
        notes: activity.notes,
        date: activity.date ? parseDateString(activity.date) : undefined,
      });

      // Si l'activité a une route, l'ajouter
      if (activity.route && activity.route.coordinates.length > 0) {
        await ActivitiesService.addRoutePoints(
          newActivity.id,
          activity.route.coordinates.map(coord => ({
            latitude: coord.latitude,
            longitude: coord.longitude,
            timestamp: coord.timestamp,
          }))
        );

        // Ajouter les pauses si présentes
        if (activity.route.pauses && activity.route.pauses.length > 0) {
          await ActivitiesService.addPauses(
            newActivity.id,
            activity.route.pauses.map(pause => ({
              startTime: pause.startTime,
              endTime: pause.endTime,
              latitude: pause.location.latitude,
              longitude: pause.location.longitude,
            }))
          );
        }
      }

      // Mettre à jour les statistiques du profil
      await updateProfileStats(activity.distance, durationSeconds);

      // Rafraîchir la liste des activités
      if (refetch) {
        await refetch();
      }

      return newActivity;
    } catch (error: any) {
      console.error('Erreur lors de l\'ajout de l\'activité:', error);
      throw error;
    } finally {
      setIsAdding(false);
    }
  };

  /**
   * Supprime une activité de Supabase
   */
  const deleteActivity = async (activityId: string) => {
    try {
      setIsDeleting(true);
      await ActivitiesService.deleteActivity(activityId);
      
      // Rafraîchir la liste des activités
      if (refetch) {
        await refetch();
      }
    } catch (error: any) {
      console.error('Erreur lors de la suppression de l\'activité:', error);
      throw error;
    } finally {
      setIsDeleting(false);
    }
  };

  /**
   * Met à jour les statistiques du profil après l'ajout d'une activité
   */
  const updateProfileStats = async (distance: number, durationSeconds: number) => {
    try {
      const currentUser = await getCurrentUserFromDB();
      if (!currentUser) return;

      const currentProfile = await ProfileService.getProfile();
      if (!currentProfile) return;

      // Calculer les nouvelles statistiques
      const newStats = calculateNewStats(
        currentProfile.stats,
        distance,
        durationSeconds
      );

      // Mettre à jour dans Supabase
      await updateUserProfileStats(currentUser.id, newStats);
    } catch (error) {
      // Ne pas bloquer l'ajout de l'activité si la mise à jour du profil échoue
      console.error('Erreur lors de la mise à jour des statistiques:', error);
    }
  };

  return {
    activities,
    loading: loading || isAdding || isDeleting,
    error,
    addActivity,
    deleteActivity,
    refetch,
  };
}

/**
 * Convertit une durée formatée (ex: "30:00" ou "28 min") en secondes
 */
function parseDurationToSeconds(duration: string): number {
  // Format "MM:SS" ou "HH:MM:SS"
  if (duration.includes(':')) {
    const parts = duration.split(':').map(Number);
    if (parts.length === 2) {
      return parts[0] * 60 + parts[1];
    } else if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
  }
  
  // Format "XX min" ou "Xh XX min"
  const minMatch = duration.match(/(\d+)\s*min/);
  const hourMatch = duration.match(/(\d+)\s*h/);
  
  let seconds = 0;
  if (hourMatch) {
    seconds += parseInt(hourMatch[1]) * 3600;
  }
  if (minMatch) {
    seconds += parseInt(minMatch[1]) * 60;
  }
  
  return seconds || 0;
}

/**
 * Parse une date formatée (ex: "21 Mars 2024") vers ISO string
 */
function parseDateString(dateString: string): string {
  try {
    // Essayer de parser la date
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      return date.toISOString();
    }
    
    // Si échec, retourner la date actuelle
    return new Date().toISOString();
  } catch {
    return new Date().toISOString();
  }
}