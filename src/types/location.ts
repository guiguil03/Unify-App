export interface Location {
  latitude: number;
  longitude: number;
}

export interface Region extends Location {
  latitudeDelta: number;
  longitudeDelta: number;
}

export type LocationOrNull = Location | null;