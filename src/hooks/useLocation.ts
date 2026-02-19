import { useState, useEffect } from 'react';
import { LocationService } from '../services/location/LocationService';
import { Location } from '../types/location';

// Cache module-level : survit aux remounts de composant
let _cachedLocation: Location | null = null;

export const useLocation = () => {
  // Démarre avec la position en cache si disponible (remount instantané)
  const [location, setLocation] = useState<Location | null>(_cachedLocation);
  const [loading, setLoading] = useState(_cachedLocation === null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const getCurrentLocation = async () => {
      try {
        // Si pas de cache, afficher le loading
        if (!_cachedLocation) setLoading(true);
        setError(null);
        const currentLocation = await LocationService.getCurrentLocation();
        _cachedLocation = currentLocation;
        setLocation(currentLocation);
      } catch (err) {
        if (__DEV__) console.error('Location error:', err);
        // Ne pas effacer la position en cache en cas d'erreur
        if (!_cachedLocation) {
          setError('Impossible d\'obtenir votre position');
        }
      } finally {
        setLoading(false);
      }
    };

    getCurrentLocation();
  }, []);

  const refreshLocation = async () => {
    try {
      const currentLocation = await LocationService.getCurrentLocation();
      _cachedLocation = currentLocation;
      setLocation(currentLocation);
      return currentLocation;
    } catch (err) {
      if (__DEV__) console.error('Location refresh failed:', err);
      return null;
    }
  };

  return { location, loading, error, refreshLocation };
};
