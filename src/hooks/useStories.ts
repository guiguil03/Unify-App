import { useState, useEffect, useCallback } from 'react';
import { StoriesService, Story } from '../services/StoriesService';
import { useAuth } from '../contexts/AuthContext';

export function useStories() {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchStories = useCallback(async () => {
    if (!user) {
      setLoading(false);
      setStories([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const fetchedStories = await StoriesService.getActiveStories();
      setStories(fetchedStories);
    } catch (err: any) {
      if (err?.message?.includes('Utilisateur non authentifié')) {
        setStories([]);
        setError(null);
      } else {
        setError('Impossible de charger les stories');
        console.error('Erreur lors du chargement des stories:', err);
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchStories();
  }, [fetchStories]);

  return { stories, loading, error, refetch: fetchStories };
}

