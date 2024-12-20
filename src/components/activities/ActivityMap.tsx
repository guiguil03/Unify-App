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
  return (
    <View style={styles.mapContainer}>
      <MapView style={styles.map} initialRegion={initialRegion}>
        <Polyline
          coordinates={route.coordinates.map((coord) => ({
            latitude: coord.latitude,
            longitude: coord.longitude,
          }))}
          strokeColor="#E83D4D"
          strokeWidth={3}
        />

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
