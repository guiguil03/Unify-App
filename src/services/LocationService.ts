import * as Location from 'expo-location';

const DEFAULT_LOCATION = {
  latitude: 48.8566,
  longitude: 2.3522,
};

export class LocationService {
  static async requestPermissions(): Promise<boolean> {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted';
  }

  static async getCurrentLocation() {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        throw new Error('Location permission not granted');
      }

      const location = await Location.getCurrentPositionAsync({});
      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
    } catch (error) {
      if (__DEV__) console.error('Location fetch failed:', error);
      return DEFAULT_LOCATION;
    }
  }
}