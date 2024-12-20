import React from "react";
import { StyleSheet, View } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Location, Region } from "../../types/location";
import { Runner } from "../../types/runner";
import { formatDistance } from "../../utils/format";

interface RunnerMapProps {
  userLocation: Location;
  runners: Runner[];
  initialRegion: Region;
  selectedRunner: Runner | null;
}

export function RunnerMap({
  userLocation,
  runners,
  initialRegion,
  selectedRunner,
}: RunnerMapProps) {
  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={initialRegion}
        showsUserLocation
        showsMyLocationButton
      >
        {runners.map((runner) => (
          <Marker
            key={runner.id}
            coordinate={runner.location}
            title={runner.name}
            description={`Distance: ${formatDistance(runner.distance)} - Allure: ${runner.pace}`}
            pinColor={selectedRunner?.id === runner.id ? "#E83D4D" : undefined}
          >
            <MaterialCommunityIcons
              name="run"
              size={24}
              color={selectedRunner?.id === runner.id ? "#E83D4D" : "#666"}
            />
          </Marker>
        ))}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
});
