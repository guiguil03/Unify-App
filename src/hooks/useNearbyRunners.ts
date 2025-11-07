import { useState, useEffect } from 'react';
import { RunnersService } from '../services/RunnersService';
import { Runner } from '../types/runner';
import { Location } from '../types/location';
import { MAP_DEFAULTS } from '../constants/mapDefaults';

export const useNearbyRunners = (location: Location | null, radiusKm: number = MAP_DEFAULTS.SEARCH.DEFAULT_RADIUS) => {
  const [runners, setRunners] = useState<Runner[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadRunners = async () => {
      if (!location) {
        if (isMounted) {
          setRunners([]);
        }
        return;
      }

      try {
        setIsLoading(true);
        const nearbyRunners = await RunnersService.getNearbyRunners(location, radiusKm);
        if (isMounted) {
          setRunners(nearbyRunners);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des coureurs à proximité:', error);
        if (isMounted) {
          setRunners([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadRunners();

    return () => {
      isMounted = false;
    };
  }, [location, radiusKm]);

  return { runners, isLoading };
};