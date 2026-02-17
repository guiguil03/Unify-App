import { useState, useEffect } from 'react';
import { LocationService } from '../services/location/LocationService';
import { Location } from '../types/location';

export const useLocation = () => {
  const [location, setLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const getCurrentLocation = async () => {
      try {
        setLoading(true);
        setError(null);
        const currentLocation = await LocationService.getCurrentLocation();
        setLocation(currentLocation);
      } catch (err) {
        if (__DEV__) console.error('Location error:', err);
        setError('Impossible d\'obtenir votre position');
      } finally {
        setLoading(false);
      }
    };

    getCurrentLocation();
  }, []);

  const refreshLocation = async () => {
    try {
      const currentLocation = await LocationService.getCurrentLocation();
      setLocation(currentLocation);
      return currentLocation;
    } catch (err) {
      if (__DEV__) console.error('Location refresh failed:', err);
      return null;
    }
  };

  return { location, loading, error, refreshLocation };
};