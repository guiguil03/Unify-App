import { Location } from '../../types/location';
import { GOOGLE_MAPS_CONFIG } from './config';

interface GeocodingResult {
  location: Location;
  name: string;
  formattedAddress: string;
}

export class GeocodingService {
  static async searchLocation(query: string): Promise<GeocodingResult | null> {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(
          query
        )}&key=${GOOGLE_MAPS_CONFIG.API_KEY}&language=fr&components=country:fr`
      );

      const data = await response.json();

      if (data.status === 'OK' && data.results.length > 0) {
        const result = data.results[0];
        return {
          location: {
            latitude: result.geometry.location.lat,
            longitude: result.geometry.location.lng,
          },
          name: result.name,
          formattedAddress: result.formatted_address,
        };
      }

      return null;
    } catch (error) {
      console.error('Error searching location:', error);
      return null;
    }
  }
}