import { useState } from 'react';
import { GeocodingService } from '../services/map/GeocodingService';
import { Location } from '../types/location';

export function useMapSearch() {
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchLocation = async (query: string): Promise<Location | null> => {
    try {
      setSearching(true);
      setError(null);

      const result = await GeocodingService.searchLocation(query);
      
      if (!result) {
        setError('Aucun résultat trouvé');
        return null;
      }

      return result.location;
    } catch (err) {
      if (__DEV__) console.error('Map search failed:', err);
      setError('Erreur lors de la recherche');
      return null;
    } finally {
      setSearching(false);
    }
  };

  return {
    searchLocation,
    searching,
    error,
  };
}