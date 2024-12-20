import { Location } from '../types/location';

// Paris coordinates as default location
export const DEFAULT_LOCATION: Location = {
  latitude: 48.8566,
  longitude: 2.3522,
};

export const LOCATION_CONFIG = {
  HIGH_ACCURACY: true,
  TIMEOUT: 10000,
  MAXIMUM_AGE: 5000,
};