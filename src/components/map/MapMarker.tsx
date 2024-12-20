import React from 'react';
import { Marker } from 'react-native-maps';
import { Location } from '../../types/location';

interface MapMarkerProps {
  coordinate: Location;
  title: string;
  description?: string;
}

export function MapMarker({ coordinate, title, description }: MapMarkerProps) {
  return (
    <Marker
      coordinate={coordinate}
      title={title}
      description={description}
    />
  );
}