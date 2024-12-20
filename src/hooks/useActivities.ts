// src/hooks/useActivities.ts
import { useState, useEffect } from 'react';
import { Activity } from '../types/activity';
import { ActivitiesService } from '../services/ActivitiesService';

export const useActivities = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setLoading(true);
        setError(null);
        const fetchedActivities = await ActivitiesService.getActivities();
        setActivities(fetchedActivities);
      } catch (err) {
        setError('Unable to fetch activities');
        console.error('Error fetching activities:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, []);

  return { activities, loading, error };
};