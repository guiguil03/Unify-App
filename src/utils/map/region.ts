import { Location, Region } from '../../types/location';
import { MAP_DEFAULTS } from '../../constants/mapDefaults';

export function createRegionFromLocation(
  location: Location | null,
  zoomLevel: number = MAP_DEFAULTS.SEARCH.DEFAULT_RADIUS
): Region {
  return {
    latitude: location?.latitude ?? MAP_DEFAULTS.CENTER.latitude,
    longitude: location?.longitude ?? MAP_DEFAULTS.CENTER.longitude,
    latitudeDelta: MAP_DEFAULTS.ZOOM.latitudeDelta * zoomLevel,
    longitudeDelta: MAP_DEFAULTS.ZOOM.longitudeDelta * zoomLevel,
  };
}

export function createRegionFromRadius(
  location: Location,
  radiusKm: number,
  padding: number = 2.5 // Augmenté de 1.5 à 2.5 pour plus de dézoom
): Region {
  // Convertir le rayon en degrés de latitude/longitude approximatifs
  // 1 degré ≈ 111 km à l'équateur
  const latDelta = (radiusKm * 2 * padding) / 111;
  const lngDelta = latDelta * Math.cos(location.latitude * (Math.PI / 180));

  return {
    latitude: location.latitude,
    longitude: location.longitude,
    latitudeDelta: latDelta,
    longitudeDelta: lngDelta,
  };
}