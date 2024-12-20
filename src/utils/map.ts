import { Location, Region } from '../types/location';

export const getInitialRegion = (location: Location): Region => ({
  latitude: location.latitude,
  longitude: location.longitude,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
});