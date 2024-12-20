export const MAP_DEFAULTS = {
  ZOOM: {
    latitudeDelta: 0.037,
    longitudeDelta: 0.037,
  },
  SEARCH: {
    DEFAULT_RADIUS: 2.5,
    MIN_RADIUS: 0.5,
    MAX_RADIUS: 5,
    RADIUS_STEP: 0.5,
  },
  CENTER: {
    latitude: 48.8566,
    longitude: 2.3522,
  },
} as const;