import React, { forwardRef, useMemo, useCallback } from "react";
import { StyleSheet, View, Platform } from "react-native";
import MapView from "react-native-maps";
import { Location, Region } from "../../types/location";
import { Runner } from "../../types/runner";
import { RunnerMarker } from "./RunnerMarker";
import { ClusterMarker } from "./ClusterMarker";
import { clusterRunners } from "../../utils/map/clustering";

interface RunnerMapProps {
  userLocation: Location;
  runners: Runner[];
  initialRegion: Region;
  selectedRunner: Runner | null;
  onRunnerPress: (runner: Runner) => void;
  onMarkerPress: (runner: Runner) => void;
  onClusterPress: (runners: Runner[]) => void;
  onMapPress?: () => void;
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
      onClusterPress,
      onMapPress,
      children,
    },
    ref
  ) => {
    // Recalculer les clusters uniquement quand la liste de runners change
    const clusters = useMemo(() => clusterRunners(runners), [runners]);
    
    // Créer une fonction wrapper pour onClusterPress pour garantir qu'elle est toujours définie
    const handleClusterPress = useCallback((runners: Runner[]) => {
      if (onClusterPress) {
        onClusterPress(runners);
      }
    }, [onClusterPress]);

    return (
      <View style={styles.container}>
        <MapView
          ref={ref}
          style={styles.map}
          provider={Platform.select({
            android: "google",
            ios: undefined,
          })}
          initialRegion={initialRegion}
          showsUserLocation={true}
          showsMyLocationButton={true}
          mapType="standard"
          // S'assurer que tous les markers sont rendus même s'ils ne sont pas visibles
          removeClippedSubviews={false}
          {...(onMapPress ? { onPress: onMapPress } : {})}
        >
          {clusters.map((cluster) => {
            // Cluster d'un seul runner → marker individuel normal
            if (cluster.runners.length === 1) {
              const runner = cluster.runners[0];
              return (
                <RunnerMarker
                  key={runner.id}
                  runner={runner}
                  isSelected={selectedRunner?.id === runner.id}
                  onPress={() => {
                    onMarkerPress(runner);
                    onRunnerPress(runner);
                  }}
                />
              );
            }

            // Cluster de 2+ runners → ClusterMarker
            return (
              <ClusterMarker
                key={cluster.id}
                cluster={cluster}
                onPress={handleClusterPress}
              />
            );
          })}
          {children}
        </MapView>
      </View>
    );
  }
);

RunnerMap.displayName = 'RunnerMap';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
});
