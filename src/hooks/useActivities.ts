// src/hooks/useActivities.ts
import { useState, useEffect, useCallback } from 'react';
import { Activity } from '../types/activity';
import { ActivitiesService } from '../services/ActivitiesService';
import { useAuth } from '../contexts/AuthContext';

export const useActivities = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchActivities = useCallback(async () => {
    // Si l'utilisateur n'est pas authentifié, retourner une liste vide
    if (!user) {
      setLoading(false);
      setActivities([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const fetchedActivities = await ActivitiesService.getActivities();
      setActivities(fetchedActivities);
    } catch (err: any) {
      // Gérer silencieusement les erreurs d'authentification
      if (err?.message?.includes('Utilisateur non authentifié')) {
        setActivities([]);
        setError(null);
      } else {
        setError('Unable to fetch activities');
        if (!err?.message?.includes('Utilisateur non authentifié')) {
          console.error('Error fetching activities:', err);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  return { activities, loading, error, refetch: fetchActivities };
};