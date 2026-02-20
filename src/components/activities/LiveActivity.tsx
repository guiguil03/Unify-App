import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  AppState,
} from "react-native";
import MapView, { Polyline, Marker } from "react-native-maps";
import * as ExpoLocation from "expo-location";
import * as TaskManager from "expo-task-manager";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { formatDuration, formatDistance } from "../../utils/format";
import { LiveActivityService } from "../../services/LiveActivityService";
import { RunnersService } from "../../services/RunnersService";
import { Route } from "../../types/route";
import { COLORS } from "../../constants/colors";

// ── Constants ─────────────────────────────────────────────────────────────────
const BG_TASK_NAME = "UNIFY_BG_LOCATION";
const BG_POINTS_KEY = "@unify/bg_points";

type BgPoint = { lat: number; lng: number; ts: number };

// ── Background task (module-level, obligatoire avant tout appel) ──────────────
// Wrappé en try-catch : avec newArchEnabled les modules natifs peuvent ne pas
// être prêts au chargement du module → protège contre un crash au démarrage.
try {
  if (!TaskManager.isTaskDefined(BG_TASK_NAME)) {
    TaskManager.defineTask(BG_TASK_NAME, async ({ data, error }: any) => {
      if (error || !data?.locations) return;
      try {
        const raw = await AsyncStorage.getItem(BG_POINTS_KEY);
        const existing: BgPoint[] = raw ? JSON.parse(raw) : [];
        const newPoints: BgPoint[] = (
          data.locations as ExpoLocation.LocationObject[]
        ).map((loc) => ({
          lat: loc.coords.latitude,
          lng: loc.coords.longitude,
          ts: loc.timestamp,
        }));
        await AsyncStorage.setItem(
          BG_POINTS_KEY,
          JSON.stringify([...existing, ...newPoints])
        );
      } catch {}
    });
  }
} catch {
  // Le module natif TaskManager n'est pas encore prêt (nouvelle architecture)
  // Le tracking background sera indisponible mais l'app ne crashe pas
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function haversineKm(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number }
): number {
  const R = 6371;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((a.latitude * Math.PI) / 180) *
      Math.cos((b.latitude * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

function fmtPace(durationSec: number, distanceKm: number): string {
  if (distanceKm <= 0) return "--:--";
  const secPerKm = durationSec / distanceKm;
  const m = Math.floor(secPerKm / 60);
  const s = Math.floor(secPerKm % 60);
  return `${m}:${s.toString().padStart(2, "0")} /km`;
}

// ── Types ─────────────────────────────────────────────────────────────────────
type TrackPoint = { latitude: number; longitude: number; timestamp: number };

interface LiveActivityProps {
  onFinish: (activity: {
    distance: number;
    duration: string;
    date: string;
    trackedPath?: Array<{ latitude: number; longitude: number }>;
  }) => void;
  onCancel: () => void;
  route?: Route;
}

// ── Component ─────────────────────────────────────────────────────────────────
export function LiveActivity({ onFinish, onCancel, route }: LiveActivityProps) {
  const [isRunning, setIsRunning] = useState(true);
  const [startTime] = useState(() => new Date());
  const [duration, setDuration] = useState(0);
  const [distance, setDistance] = useState(0);
  const [trackedPath, setTrackedPath] = useState<TrackPoint[]>([]);
  const [initialRegion, setInitialRegion] = useState<any>(null);

  // Refs stables pour les callbacks (évite les closures périmées)
  const prevPtRef = useRef<{ latitude: number; longitude: number } | null>(null);
  const distanceRef = useRef(0);
  const durationRef = useRef(0);
  const isRunningRef = useRef(true);
  const trackedPathRef = useRef<TrackPoint[]>([]);
  const startTimeRef = useRef(startTime);

  useEffect(() => { distanceRef.current = distance; }, [distance]);
  useEffect(() => { durationRef.current = duration; }, [duration]);
  useEffect(() => { isRunningRef.current = isRunning; }, [isRunning]);
  useEffect(() => { trackedPathRef.current = trackedPath; }, [trackedPath]);

  // ── Notification persistante ──────────────────────────────────────────────
  useEffect(() => {
    LiveActivityService.startActivity();
    return () => {
      LiveActivityService.stopActivity();
      RunnersService.deactivateRunner().catch(() => {});
    };
  }, []);

  // ── Timer : 1 tick / seconde ──────────────────────────────────────────────
  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      setDuration((prev) => {
        const nd = prev + 1;
        LiveActivityService.updateActivity(nd, distanceRef.current);
        return nd;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning]);

  // ── GPS tracking ──────────────────────────────────────────────────────────
  useEffect(() => {
    let fgSub: ExpoLocation.LocationSubscription | null = null;
    let active = true;

    const addPoint = (
      pt: { latitude: number; longitude: number },
      timestampMs: number
    ) => {
      if (!active) return;
      if (prevPtRef.current) {
        const inc = haversineKm(prevPtRef.current, pt);
        // Filtre: ignore < 3m (jitter GPS) et > 200m (mauvais fix)
        if (inc > 0.003 && inc < 0.2) {
          setDistance((prev) => {
            distanceRef.current = prev + inc;
            return prev + inc;
          });
          const ts = Math.floor(
            (timestampMs - startTimeRef.current.getTime()) / 1000
          );
          setTrackedPath((prev) => [...prev, { ...pt, timestamp: ts }]);
        }
      }
      prevPtRef.current = pt;
    };

    const startTracking = async () => {
      // Foreground permissions
      const { status: fgStatus } =
        await ExpoLocation.requestForegroundPermissionsAsync();
      if (fgStatus !== "granted" || !active) return;

      // Vider les points background d'une éventuelle session précédente
      await AsyncStorage.removeItem(BG_POINTS_KEY);

      // Position initiale pour centrer la carte immédiatement
      try {
        const initial = await ExpoLocation.getCurrentPositionAsync({
          accuracy: ExpoLocation.Accuracy.High,
        });
        if (!active) return;
        const pt = {
          latitude: initial.coords.latitude,
          longitude: initial.coords.longitude,
        };
        prevPtRef.current = pt;
        setTrackedPath([{ ...pt, timestamp: 0 }]);
        setInitialRegion({
          latitude: pt.latitude,
          longitude: pt.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        });
        RunnersService.updateRunnerPosition({
          latitude: pt.latitude,
          longitude: pt.longitude,
          distance: 0,
          pace: "--:--",
          isActive: true,
        }).catch(() => {});
      } catch (e) {
        if (__DEV__) console.error("Initial GPS failed:", e);
      }

      // ── Background location permissions ────────────────────────────────
      const { status: bgStatus } =
        await ExpoLocation.requestBackgroundPermissionsAsync();

      // ── Surveillance foreground (temps réel, met à jour le state) ──────
      fgSub = await ExpoLocation.watchPositionAsync(
        { accuracy: ExpoLocation.Accuracy.High, distanceInterval: 5 },
        (loc) => {
          if (!isRunningRef.current) return;
          addPoint(
            { latitude: loc.coords.latitude, longitude: loc.coords.longitude },
            loc.timestamp
          );
          // Mise à jour runner sur la carte (fire-and-forget)
          const paceStr = fmtPace(durationRef.current, distanceRef.current);
          RunnersService.updateRunnerPosition({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
            distance: distanceRef.current,
            pace: paceStr,
            paceSeconds:
              distanceRef.current > 0
                ? Math.round(durationRef.current / distanceRef.current)
                : 0,
            isActive: true,
          }).catch(() => {});
        }
      );

      // ── Background location task (écran verrouillé) ────────────────────
      if (bgStatus === "granted") {
        try {
          const alreadyRunning =
            await ExpoLocation.hasStartedLocationUpdatesAsync(BG_TASK_NAME);
          if (!alreadyRunning) {
            await ExpoLocation.startLocationUpdatesAsync(BG_TASK_NAME, {
              accuracy: ExpoLocation.Accuracy.High,
              distanceInterval: 5,
              showsBackgroundLocationIndicator: true, // iOS : barre bleue
              foregroundService: {
                // Android : notification persistante
                notificationTitle: "Course en cours",
                notificationBody: "Votre parcours est enregistré",
                notificationColor: "#7D80F4",
              },
            });
          }
        } catch (e) {
          if (__DEV__) console.error("BG location start failed:", e);
        }
      }
    };

    startTracking();
    return () => {
      active = false;
      fgSub?.remove();
    };
  }, []); // une seule fois au montage

  // ── Réconciliation au retour au premier plan ──────────────────────────────
  useEffect(() => {
    const sub = AppState.addEventListener("change", async (nextState) => {
      if (nextState !== "active" || !isRunningRef.current) return;

      // Resync le timer (l'interval était pausé)
      const elapsed = Math.floor(
        (Date.now() - startTimeRef.current.getTime()) / 1000
      );
      setDuration(elapsed);

      // Récupérer les points enregistrés en background
      try {
        const raw = await AsyncStorage.getItem(BG_POINTS_KEY);
        if (!raw) return;
        const bgPoints: BgPoint[] = JSON.parse(raw);
        if (bgPoints.length === 0) return;

        // Trouver le timestamp du dernier point connu
        const path = trackedPathRef.current;
        const lastKnownTs =
          path.length > 0
            ? startTimeRef.current.getTime() +
              path[path.length - 1].timestamp * 1000
            : 0;

        // Ne traiter que les nouveaux points
        const newBgPoints = bgPoints.filter((p) => p.ts > lastKnownTs + 1000);
        if (newBgPoints.length === 0) return;

        // Calculer la distance additionnelle et construire les points
        let prev = prevPtRef.current;
        let addedDist = 0;
        const newTrackPoints: TrackPoint[] = [];

        for (const p of newBgPoints) {
          const pt = { latitude: p.lat, longitude: p.lng };
          if (prev) {
            const inc = haversineKm(prev, pt);
            if (inc > 0.003 && inc < 0.2) {
              addedDist += inc;
              const ts = Math.floor(
                (p.ts - startTimeRef.current.getTime()) / 1000
              );
              newTrackPoints.push({ ...pt, timestamp: ts });
            }
          }
          prev = pt;
        }

        if (newTrackPoints.length > 0) {
          setDistance((prev) => {
            distanceRef.current = prev + addedDist;
            return prev + addedDist;
          });
          setTrackedPath((prev) => [...prev, ...newTrackPoints]);
          prevPtRef.current = {
            latitude: newTrackPoints[newTrackPoints.length - 1].latitude,
            longitude: newTrackPoints[newTrackPoints.length - 1].longitude,
          };
        }
      } catch (e) {
        if (__DEV__) console.error("BG sync failed:", e);
      }
    });
    return () => sub.remove();
  }, []);

  // ── Stop propre ───────────────────────────────────────────────────────────
  const stopAll = async () => {
    setIsRunning(false);
    isRunningRef.current = false;
    await LiveActivityService.stopActivity();
    try {
      await RunnersService.deactivateRunner();
    } catch {}
    try {
      const running =
        await ExpoLocation.hasStartedLocationUpdatesAsync(BG_TASK_NAME);
      if (running) await ExpoLocation.stopLocationUpdatesAsync(BG_TASK_NAME);
    } catch {}
    await AsyncStorage.removeItem(BG_POINTS_KEY);
  };

  const handleFinish = async () => {
    await stopAll();
    onFinish({
      distance: parseFloat(distanceRef.current.toFixed(2)),
      duration: formatDuration(durationRef.current),
      date: new Date().toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
      trackedPath:
        trackedPathRef.current.length > 0
          ? trackedPathRef.current.map((p) => ({
              latitude: p.latitude,
              longitude: p.longitude,
            }))
          : undefined,
    });
  };

  const handleCancel = async () => {
    await stopAll();
    onCancel();
  };

  // ── Map ───────────────────────────────────────────────────────────────────
  const routeCoords =
    route?.points?.map((p) => ({
      latitude: p.latitude,
      longitude: p.longitude,
    })) || [];

  return (
    <View style={styles.container}>
      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          initialRegion={initialRegion || undefined}
          showsUserLocation
          followsUserLocation={isRunning}
        >
          {route && routeCoords.length > 1 && (
            <Polyline
              coordinates={routeCoords}
              strokeColor={COLORS.textLight}
              strokeWidth={3}
              lineDashPattern={[5, 5]}
            />
          )}
          {trackedPath.length > 1 && (
            <Polyline
              coordinates={trackedPath}
              strokeColor={COLORS.primary}
              strokeWidth={5}
            />
          )}
          {route?.points?.[0] && (
            <Marker
              coordinate={{
                latitude: route.points[0].latitude,
                longitude: route.points[0].longitude,
              }}
              title="Départ prévu"
              pinColor="green"
            />
          )}
          {route?.points && route.points.length > 1 && (
            <Marker
              coordinate={{
                latitude: route.points[route.points.length - 1].latitude,
                longitude: route.points[route.points.length - 1].longitude,
              }}
              title="Arrivée prévue"
              pinColor="red"
            />
          )}
          {trackedPath.length > 0 && (
            <Marker coordinate={trackedPath[0]} title="Départ" pinColor="blue" />
          )}
        </MapView>

        {route && (
          <View style={styles.routeInfoOverlay}>
            <Text style={styles.routeInfoText}>{route.title}</Text>
            <Text style={styles.routeInfoSubtext}>
              {route.distance.toFixed(2)} km
            </Text>
          </View>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>
          {route ? `Course sur : ${route.title}` : "Course en cours"}
        </Text>

        <View style={styles.stats}>
          <StatItem icon="timer" label="Durée" value={formatDuration(duration)} />
          <StatItem
            icon="map-marker-distance"
            label="Distance"
            value={formatDistance(distance)}
          />
          <StatItem
            icon="speedometer"
            label="Allure"
            value={fmtPace(duration, distance)}
          />
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={handleCancel}
          >
            <MaterialCommunityIcons name="close" size={24} color="#666" />
            <Text style={styles.cancelButtonText}>Annuler</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.finishButton]}
            onPress={handleFinish}
          >
            <MaterialCommunityIcons
              name="flag-checkered"
              size={24}
              color="white"
            />
            <Text style={styles.buttonText}>Terminer</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

function StatItem({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.stat}>
      <MaterialCommunityIcons name={icon as any} size={24} color="#7D80F4" />
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "white" },
  mapContainer: { height: 300, width: "100%", position: "relative" },
  map: { flex: 1 },
  routeInfoOverlay: {
    position: "absolute",
    top: 16,
    left: 16,
    backgroundColor: "rgba(255,255,255,0.95)",
    padding: 12,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  routeInfoText: { fontSize: 16, fontWeight: "700", color: COLORS.text },
  routeInfoSubtext: { fontSize: 14, color: COLORS.textLight, marginTop: 4 },
  card: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    margin: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  stats: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  stat: { alignItems: "center", flex: 1 },
  statLabel: { fontSize: 14, color: "#666", marginTop: 4 },
  statValue: { fontSize: 16, fontWeight: "600", marginTop: 2 },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  button: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  finishButton: { backgroundColor: "#7D80F4" },
  cancelButton: { backgroundColor: "#f5f5f5" },
  buttonText: { color: "white", fontWeight: "600" },
  cancelButtonText: { color: "#666", fontWeight: "600" },
});
