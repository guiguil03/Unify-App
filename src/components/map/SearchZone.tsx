import React from "react";
import { Circle } from "react-native-maps";
import { Location } from "../../types/location";
import { MAP_STYLES } from "../../services/map/config";

interface SearchZoneProps {
  center: Location;
  radius: number;
  visible: boolean;
}

export function SearchZone({ center, radius, visible }: SearchZoneProps) {
  if (!visible) return null;

  return (
    <Circle
      center={center}
      radius={radius * 1000} // Convertir km en mètres
      fillColor={MAP_STYLES.ZONE_FILL_COLOR}
      strokeColor={MAP_STYLES.ZONE_STROKE_COLOR}
      strokeWidth={2}
      zIndex={1}
      pointerEvents="none"
    />
  );
}
