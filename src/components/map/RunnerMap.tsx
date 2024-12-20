import React, { forwardRef, useRef, useEffect } from "react";
import { StyleSheet, View, Text, TouchableOpacity } from "react-native";
import MapView, { Marker, Callout } from "react-native-maps";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Location, Region } from "../../types/location";
import { Runner } from "../../types/runner";
import { MAP_STYLES } from "../../services/map/config";
import { formatDistance } from "../../utils/format";

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
    const markerRefs = useRef<{ [key: string]: Marker | null }>({});

    useEffect(() => {
      if (selectedRunner) {
        const marker = markerRefs.current[selectedRunner.id];
        if (marker) {
          marker.showCallout();
        }
      }
    }, [selectedRunner]);

    return (
      <View style={styles.container}>
        <MapView
          ref={ref}
          style={styles.map}
          provider="google"
          initialRegion={initialRegion}
          showsUserLocation
        >
          {runners.map((runner) => (
            <Marker
              ref={(ref) => (markerRefs.current[runner.id] = ref)}
              key={runner.id}
              coordinate={runner.location}
              onPress={() => onMarkerPress(runner)}
              pinColor={
                selectedRunner?.id === runner.id
                  ? MAP_STYLES.SELECTED_MARKER
                  : undefined
              }
            >
              <MaterialCommunityIcons
                name="run"
                size={24}
                color={
                  selectedRunner?.id === runner.id
                    ? MAP_STYLES.SELECTED_MARKER
                    : MAP_STYLES.DEFAULT_MARKER
                }
              />
              <Callout onPress={() => onRunnerPress(runner)} tooltip>
                <View style={styles.callout}>
                  <View style={styles.calloutContent}>
                    <View style={styles.calloutHeader}>
                      <View style={styles.nameContainer}>
                        <Text style={styles.runnerName}>{runner.name}</Text>
                        <Text style={styles.distance}>
                          à {formatDistance(runner.distance)}
                        </Text>
                      </View>
                      <View style={styles.paceBox}>
                        <MaterialCommunityIcons
                          name="speedometer"
                          size={14}
                          color="#666"
                        />
                        <Text style={styles.paceValue}>{runner.pace}</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.interactButton}
                        onPress={() => onRunnerPress(runner)}
                      >
                        <MaterialCommunityIcons
                          name="chevron-right"
                          size={20}
                          color="#E83D4D"
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </Callout>
            </Marker>
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
  callout: {
    padding: 12,
    width: 240,
    backgroundColor: "white",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  calloutContent: {
    flex: 1,
  },
  calloutHeader: {
    flexDirection: "row",
    alignItems: "center",
    height: 48,
  },
  nameContainer: {
    flex: 1,
    marginRight: 4,
  },
  runnerName: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 2,
  },
  distance: {
    fontSize: 12,
    color: "#666",
  },
  paceBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    gap: 4,
    marginRight: 8,
  },
  paceValue: {
    fontSize: 12,
    fontWeight: "500",
    color: "#666",
  },
  interactButton: {
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
});
