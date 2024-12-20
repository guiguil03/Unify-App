import { Location } from '../types/location';

interface GeocodingResult {
  location: Location;
  formattedAddress: string;
}

export class GeocodingService {
  private static API_KEY = 'AIzaSyBoUJi0drvd9OUota6hSMsrPCwMcIqG23M'; // À remplacer par votre clé API

  static async searchLocation(query: string): Promise<GeocodingResult | null> {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
          query
        )}&key=${this.API_KEY}`
      );

      const data = await response.json();

      if (data.status === 'OK' && data.results.length > 0) {
        const result = data.results[0];
        const { lat, lng } = result.geometry.location;

        return {
          location: {
            latitude: lat,
            longitude: lng,
          },
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