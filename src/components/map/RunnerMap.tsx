import React, { forwardRef } from "react";
import { StyleSheet, View, Platform } from "react-native";
import MapView from "react-native-maps";
import { Location, Region } from "../../types/location";
import { Runner } from "../../types/runner";
import { RunnerMarker } from "./RunnerMarker";

interface RunnerMapProps {
  userLocation: Location;
  runners: Runner[];
  initialRegion: Region;
  selectedRunner: Runner | null;
  onRunnerPress: (runner: Runner) => void;
  onMarkerPress: (runner: Runner) => void;
  children?: React.ReactNode;
}

export const RunnerMap = forwardRef<MapView, RunnerMapProps>(
  (
    {
      userLocation,
      runners,
      initialRegion,
      selectedRunner,
      onRunnerPress,
      onMarkerPress,
      children,
    },
    ref
  ) => {
    return (
      <View style={styles.container}>
        <MapView
          ref={ref}
          style={styles.map}
          provider={Platform.select({
            android: "google",
            ios: undefined, // Use default Apple Maps on iOS
          })}
          initialRegion={initialRegion}
          showsUserLocation
        >
          {runners.map((runner) => (
            <RunnerMarker
              key={runner.id}
              runner={runner}
              isSelected={selectedRunner?.id === runner.id}
              onPress={() => {
                onMarkerPress(runner);
                onRunnerPress(runner);
              }}
            />
          ))}
          {children}
        </MapView>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
});
