import { Location } from './location/LocationService';

export interface Runner {
  id: string;
  name: string;
  location: Location;
  distance: number; // Distance from current user in km
  pace: string; // Average pace
}

export class RunnersService {
  static getNearbyRunners(currentLocation: Location): Runner[] {
    // Simuler des coureurs à proximité
    return [
      {
        id: '1',
        name: 'Marie L.',
        location: {
          latitude: currentLocation.latitude + 0.002,
          longitude: currentLocation.longitude + 0.001
        },
        distance: 0.3,
        pace: "5:30 min/km"
      },
      {
        id: '2',
        name: 'Thomas R.',
        location: {
          latitude: currentLocation.latitude - 0.001,
          longitude: currentLocation.longitude + 0.002
        },
        distance: 0.5,
        pace: "6:00 min/km"
      },
      {
        id: '3',
        name: 'Sophie M.',
        location: {
          latitude: currentLocation.latitude + 0.003,
          longitude: currentLocation.longitude - 0.001
        },
        distance: 0.7,
        pace: "5:45 min/km"
      }
    ];
  }
}