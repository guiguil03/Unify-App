import React from "react";
import { View, StyleSheet } from "react-native";
import MapView, { Circle } from "react-native-maps";
import { Location } from "../../types/location";

interface MapOverlayProps {
  location: Location;
  radius: number;
  visible: boolean;
}

export function MapOverlay({ location, radius, visible }: MapOverlayProps) {
  if (!visible) return null;

  return (
    <Circle
      center={location}
      radius={radius * 1000} // Convert km to meters
      fillColor="rgba(101, 173, 241, 0.2)"
      strokeColor="#E83D4D"
      strokeWidth={2}
    />
  );
}
