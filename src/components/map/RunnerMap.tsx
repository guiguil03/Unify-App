import React, { forwardRef, useMemo, useCallback, useState, useRef, useEffect } from "react";
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

/**
 * Retourne le niveau de zoom (1–5) selon latitudeDelta.
 * Utilisé pour ne déclencher un re-render que quand le band change.
 */
function getZoomBand(delta: number): number {
  if (delta < 0.004) return 5;
  if (delta < 0.012) return 4;
  if (delta < 0.035) return 3;
  if (delta < 0.09)  return 2;
  return 1;
}

/**
 * Seuil de clustering fixe par niveau de zoom.
 * Fixe (pas proportionnel au delta) = pas de re-clustering à chaque micro-zoom.
 */
const CLUSTER_THRESHOLD_BY_BAND: Record<number, number> = {
  1: 0.005,   // très dézoomé  → ~550m
  2: 0.002,   // dézoomé       → ~220m
  3: 0.001,   // zoom normal   → ~110m (valeur d'origine)
  4: 0.0003,  // zoomé         → ~33m
  5: 0.0001,  // très zoomé    → ~11m
};

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
    const initialDelta = initialRegion?.latitudeDelta;
    const [zoomBand, setZoomBand] = useState(
      () => getZoomBand(isFinite(initialDelta) && initialDelta > 0 ? initialDelta : 0.1)
    );
    const zoomTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
      return () => {
        if (zoomTimerRef.current) clearTimeout(zoomTimerRef.current);
      };
    }, []);

    // Le seuil de clustering et le nombre d'avatars sont dérivés du band (entier 1–5).
    // → Re-clustering uniquement quand on franchit un band, pas à chaque micro-zoom.
    const maxAvatars = zoomBand;                              // band 1→1 avatar, band 5→5 avatars
    const clusterThreshold = CLUSTER_THRESHOLD_BY_BAND[zoomBand] ?? 0.001;

    const clusters = useMemo(
      () => clusterRunners(runners, clusterThreshold),
      [runners, clusterThreshold]
    );

    const handleRegionChangeComplete = useCallback((region: Region) => {
      // Guard : region peut être null/NaN/0 sur certains appareils Android à zoom extrême
      const delta = region?.latitudeDelta;
      if (delta == null || !isFinite(delta) || delta <= 0) return;

      const newBand = getZoomBand(delta);
      if (zoomTimerRef.current) clearTimeout(zoomTimerRef.current);

      // Debounce + mise à jour UNIQUEMENT si le band change
      // → zéro re-render pour les micro-zooms dans le même band
      zoomTimerRef.current = setTimeout(() => {
        setZoomBand(prev => (prev !== newBand ? newBand : prev));
      }, 150);
    }, []);

    const handleClusterPress = useCallback(
      (runners: Runner[]) => { if (onClusterPress) onClusterPress(runners); },
      [onClusterPress]
    );

    return (
      <View style={styles.container}>
        <MapView
          ref={ref}
          style={styles.map}
          provider={Platform.select({ android: "google", ios: undefined })}
          initialRegion={initialRegion}
          showsUserLocation={true}
          showsMyLocationButton={true}
          mapType="standard"
          removeClippedSubviews={false}
          onRegionChangeComplete={handleRegionChangeComplete}
          {...(onMapPress ? { onPress: onMapPress } : {})}
        >
          {/* flatMap → tableau plat (évite les tableaux imbriqués dans MapView) */}
          {clusters.flatMap((cluster) => {
            // Cluster d'un seul runner → marker individuel
            if (cluster.runners.length === 1) {
              const runner = cluster.runners[0];
              return [
                <RunnerMarker
                  key={runner.id}
                  runner={runner}
                  isSelected={selectedRunner?.id === runner.id}
                  onPress={() => {
                    onMarkerPress(runner);
                    onRunnerPress(runner);
                  }}
                />,
              ];
            }

            // Cluster multi-runners → bulle avec N avatars selon le zoom
            return [
              <ClusterMarker
                key={cluster.id}
                cluster={cluster}
                maxAvatars={maxAvatars}
                onPress={handleClusterPress}
              />,
            ];
          })}
          {children}
        </MapView>
      </View>
    );
  }
);

RunnerMap.displayName = 'RunnerMap';

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
});
