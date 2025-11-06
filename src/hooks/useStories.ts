import { useState, useEffect, useCallback, useRef } from 'react';
import { StoriesService, Story } from '../services/StoriesService';
import { useAuth } from '../contexts/AuthContext';

export function useStories() {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const hasInitialLoad = useRef(false);

  const fetchStories = useCallback(async () => {
    if (!user) {
      setLoading(false);
      setStories([]);
      hasInitialLoad.current = false;
      return;
    }

    const isInitialLoad = !hasInitialLoad.current;
    
    try {
      // Ne mettre loading à true que si c'est le premier chargement
      // Pendant les rechargements, on garde les stories actuelles affichées
      if (isInitialLoad) {
        setLoading(true);
      }
      setError(null);
      const fetchedStories = await StoriesService.getActiveStories();
      // Remplacer les stories seulement une fois les nouvelles données reçues
      setStories(fetchedStories);
      hasInitialLoad.current = true;
    } catch (err: any) {
      if (err?.message?.includes('Utilisateur non authentifié')) {
        // Seulement vider si on n'a pas encore chargé, sinon garder les stories existantes
        if (isInitialLoad) {
          setStories([]);
        }
        setError(null);
        hasInitialLoad.current = false;
      } else {
        setError('Impossible de charger les stories');
        console.error('Erreur lors du chargement des stories:', err);
        // En cas d'erreur, garder les stories existantes si on en a
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

