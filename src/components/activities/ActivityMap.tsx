import React from "react";
import { View, StyleSheet } from "react-native";
import MapView, { Polyline, Marker } from "react-native-maps";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ActivityRoute } from "../../types/activity";
import { formatDuration } from "../../utils/format";

interface ActivityMapProps {
  route: ActivityRoute;
  initialRegion: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
}

export function ActivityMap({ route, initialRegion }: ActivityMapProps) {
  const routeCoordinates = route.coordinates.map((coord) => ({
    latitude: coord.latitude,
    longitude: coord.longitude,
  }));

  // Calculer la région pour inclure tout le parcours
  const mapRegion = React.useMemo(() => {
    if (routeCoordinates.length === 0) return initialRegion;
    
    const latitudes = routeCoordinates.map(coord => coord.latitude);
    const longitudes = routeCoordinates.map(coord => coord.longitude);
    
    const minLat = Math.min(...latitudes);
    const maxLat = Math.max(...latitudes);
    const minLon = Math.min(...longitudes);
    const maxLon = Math.max(...longitudes);
    
    const latDelta = Math.max((maxLat - minLat) * 1.5, 0.01);
    const lonDelta = Math.max((maxLon - minLon) * 1.5, 0.01);
    
    return {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLon + maxLon) / 2,
      latitudeDelta: latDelta,
      longitudeDelta: lonDelta,
    };
  }, [routeCoordinates, initialRegion]);

  return (
    <View style={styles.mapContainer}>
      <MapView style={styles.map} initialRegion={mapRegion} region={mapRegion}>
        {/* Tracé de la course */}
        {routeCoordinates.length > 1 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor="#7D80F4"
            strokeWidth={4}
          />
        )}

        {/* Point de départ */}
        {routeCoordinates.length > 0 && (
          <Marker
            coordinate={routeCoordinates[0]}
            title="Départ"
            pinColor="green"
          />
        )}

        {/* Point d'arrivée */}
        {routeCoordinates.length > 1 && (
          <Marker
            coordinate={routeCoordinates[routeCoordinates.length - 1]}
            title="Arrivée"
            pinColor="red"
          />
        )}

        {/* Pauses */}
        {route.pauses.map((pause, index) => (
          <Marker
            key={index}
            coordinate={{
              latitude: pause.location.latitude,
              longitude: pause.location.longitude,
            }}
            title={`Pause ${index + 1}`}
            description={`Durée: ${formatDuration((pause.endTime - pause.startTime) / 1000)}`}
          >
            <MaterialCommunityIcons
              name="pause-circle"
              size={24}
              color="#ff4444"
            />
          </Marker>
        ))}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  mapContainer: {
    height: 300,
    marginBottom: 16,
  },
  map: {
    flex: 1,
  },
});
