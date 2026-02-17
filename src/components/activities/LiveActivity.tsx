import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  AppState,
} from "react-native";
import MapView, { Polyline, Marker } from "react-native-maps";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocation } from "../../hooks/useLocation";
import { formatDuration, formatDistance } from "../../utils/format";
import { LiveActivityService } from "../../services/LiveActivityService";
import { RunnersService } from "../../services/RunnersService";
import { Route } from "../../types/route";
import { COLORS } from "../../constants/colors";

interface LiveActivityProps {
  onFinish: (activity: {
    distance: number;
    duration: string;
    date: string;
    trackedPath?: Array<{ latitude: number; longitude: number }>;
  }) => void;
  onCancel: () => void;
  route?: Route; // Parcours optionnel à suivre
}

export function LiveActivity({ onFinish, onCancel, route }: LiveActivityProps) {
  const [isRunning, setIsRunning] = useState(true);
  const [startTime] = useState(new Date());
  const [duration, setDuration] = useState(0);
  const [distance, setDistance] = useState(0);
  const [trackedPath, setTrackedPath] = useState<Array<{ latitude: number; longitude: number; timestamp: number }>>([]);
  const { location, refreshLocation } = useLocation();
  const previousLocationRef = useRef<{ latitude: number; longitude: number } | null>(null);
  const activityIdRef = useRef<string | null>(null);

  useEffect(() => {
    const setupLiveActivity = async () => {
      await LiveActivityService.startActivity();
    };
    setupLiveActivity();

    return () => {
      LiveActivityService.stopActivity();
      // Désactiver le coureur quand le composant se démonte
      RunnersService.deactivateRunner().catch((error: unknown) => {
        if (__DEV__) console.error('Runner deactivation failed:', error);
      });
    };
  }, []);

  // Activer le coureur quand la location est disponible
  useEffect(() => {
    const activateRunner = async () => {
      if (isRunning && trackedPath.length === 0) {
        // Essayer d'obtenir la location si elle n'est pas encore disponible
        let currentLocation = location;
        if (!currentLocation) {
          currentLocation = await refreshLocation();
        }
        
        if (currentLocation) {
          try {
            await RunnersService.updateRunnerPosition({
              latitude: currentLocation.latitude,
              longitude: currentLocation.longitude,
              distance: 0,
              pace: '--:--',
              isActive: true,
            });
            previousLocationRef.current = { ...currentLocation };
            
            // Initialiser le tracé avec le point de départ
            setTrackedPath([{ 
              latitude: currentLocation.latitude, 
              longitude: currentLocation.longitude,
              timestamp: Math.floor((Date.now() - startTime.getTime()) / 1000)
            }]);
            
          } catch (error) {
            if (__DEV__) console.error('Runner activation failed:', error);
          }
        } else {
          // Unable to get location for runner activation
        }
      }
    };
    activateRunner();
  }, [location, isRunning, refreshLocation, trackedPath.length]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning) {
      interval = setInterval(() => {
        setDuration((prev) => {
          const newDuration = prev + 1;
          LiveActivityService.updateActivity(newDuration, distance);
          return newDuration;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, distance]);

  // Refs pour les valeurs qui changent fréquemment
  const distanceRef = useRef(0);
  const durationRef = useRef(0);
  
  // Synchroniser les refs avec les states
  useEffect(() => {
    distanceRef.current = distance;
  }, [distance]);
  
  useEffect(() => {
    durationRef.current = duration;
  }, [duration]);

  // Mettre à jour la position du coureur périodiquement
  useEffect(() => {
    let locationUpdateInterval: NodeJS.Timeout;
    
    if (isRunning && location) {
      // Mettre à jour la position toutes les 10 secondes
      locationUpdateInterval = setInterval(async () => {
        try {
          // Rafraîchir la position
          const currentLocation = await refreshLocation();
          if (currentLocation) {
            // Calculer la distance parcourue depuis la dernière position
            let distanceIncrement = 0;
            if (previousLocationRef.current) {
              const R = 6371; // Rayon de la Terre en km
              const dLat = ((currentLocation.latitude - previousLocationRef.current.latitude) * Math.PI) / 180;
              const dLon = ((currentLocation.longitude - previousLocationRef.current.longitude) * Math.PI) / 180;
              const a =
                Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos((previousLocationRef.current.latitude * Math.PI) / 180) *
                  Math.cos((currentLocation.latitude * Math.PI) / 180) *
                  Math.sin(dLon / 2) *
                  Math.sin(dLon / 2);
              const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
              distanceIncrement = R * c;
            }

            const currentDistance = distanceRef.current + distanceIncrement;
            setDistance(currentDistance);

            // Calculer l'allure
            const currentDuration = durationRef.current;
            const paceSeconds = currentDistance > 0 && currentDuration > 0 
              ? Math.round((currentDuration / 60) / currentDistance * 60)
              : 0;
            const paceMinutes = Math.floor(paceSeconds / 60);
            const paceSecs = paceSeconds % 60;
            const paceFormatted = `${paceMinutes}:${paceSecs.toString().padStart(2, '0')} min/km`;

            // Mettre à jour la position dans la table runners
            await RunnersService.updateRunnerPosition({
              latitude: currentLocation.latitude,
              longitude: currentLocation.longitude,
              distance: currentDistance,
              pace: paceFormatted,
              paceSeconds: paceSeconds,
              isActive: true,
              activityId: activityIdRef.current || undefined,
            });

            // Ajouter le point au tracé réel avec timestamp
            setTrackedPath((prev) => {
              const currentTimestamp = Math.floor((Date.now() - startTime.getTime()) / 1000);
              
              // Éviter d'ajouter des points trop proches (seuil de ~10m)
              if (prev.length > 0) {
                const lastPoint = prev[prev.length - 1];
                const R = 6371; // Rayon de la Terre en km
                const dLat = ((currentLocation.latitude - lastPoint.latitude) * Math.PI) / 180;
                const dLon = ((currentLocation.longitude - lastPoint.longitude) * Math.PI) / 180;
                const a =
                  Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos((lastPoint.latitude * Math.PI) / 180) *
                    Math.cos((currentLocation.latitude * Math.PI) / 180) *
                    Math.sin(dLon / 2) *
                    Math.sin(dLon / 2);
                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                const distanceKm = R * c;
                
                // Ajouter seulement si la distance est supérieure à ~10m (0.01 km)
                if (distanceKm > 0.01) {
                  return [...prev, { 
                    latitude: currentLocation.latitude, 
                    longitude: currentLocation.longitude,
                    timestamp: currentTimestamp
                  }];
                }
                return prev;
              }
              // Premier point
              return [{ 
                latitude: currentLocation.latitude, 
                longitude: currentLocation.longitude,
                timestamp: currentTimestamp
              }];
            });

            previousLocationRef.current = { ...currentLocation };
          }
        } catch (error) {
          if (__DEV__) console.error('Position update failed:', error);
        }
      }, 10000); // Toutes les 10 secondes
    }

    return () => {
      if (locationUpdateInterval) {
        clearInterval(locationUpdateInterval);
      }
    };
  }, [isRunning, location, refreshLocation]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active") {
        const now = new Date();
        const elapsed = Math.floor(
          (now.getTime() - startTime.getTime()) / 1000
        );
        setDuration(elapsed);
      }
    });

    return () => {
      subscription.remove();
    };
  }, [startTime]);

  const handleFinish = async () => {
    setIsRunning(false);
    await LiveActivityService.stopActivity();
    
    // Désactiver le coureur
    try {
      await RunnersService.deactivateRunner();
    } catch (error) {
      if (__DEV__) console.error('Runner deactivation failed:', error);
    }

    const activity = {
      distance: parseFloat(distance.toFixed(2)),
      duration: formatDuration(duration),
      date: new Date().toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
      trackedPath: trackedPath.length > 0 
        ? trackedPath.map(p => ({ latitude: p.latitude, longitude: p.longitude }))
        : undefined,
    };
    onFinish(activity);
  };

  const handleCancel = async () => {
    setIsRunning(false);
    await LiveActivityService.stopActivity();
    
    // Désactiver le coureur
    try {
      await RunnersService.deactivateRunner();
    } catch (error) {
      if (__DEV__) console.error('Runner deactivation failed:', error);
    }

    onCancel();
  };

  // Calculer la région de la carte pour afficher le parcours et la position actuelle
  const getMapRegion = () => {
    const allLatitudes: number[] = [];
    const allLongitudes: number[] = [];
    
    // Ajouter les points du parcours prévu
    if (route?.points && route.points.length > 0) {
      route.points.forEach((p) => {
        allLatitudes.push(p.latitude);
        allLongitudes.push(p.longitude);
      });
    }
    
    // Ajouter les points du tracé réel
    if (trackedPath.length > 0) {
      trackedPath.forEach((p) => {
        allLatitudes.push(p.latitude);
        allLongitudes.push(p.longitude);
      });
    }
    
    // Ajouter la position actuelle
    if (location) {
      allLatitudes.push(location.latitude);
      allLongitudes.push(location.longitude);
    }
    
    if (allLatitudes.length > 0 && allLongitudes.length > 0) {
      const minLat = Math.min(...allLatitudes);
      const maxLat = Math.max(...allLatitudes);
      const minLon = Math.min(...allLongitudes);
      const maxLon = Math.max(...allLongitudes);
      
      const latDelta = Math.max((maxLat - minLat) * 1.5, 0.01);
      const lonDelta = Math.max((maxLon - minLon) * 1.5, 0.01);
      
      return {
        latitude: (minLat + maxLat) / 2,
        longitude: (minLon + maxLon) / 2,
        latitudeDelta: latDelta,
        longitudeDelta: lonDelta,
      };
    }
    
    if (location) {
      return {
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
    }
    
    return null;
  };

  const routeCoordinates = route?.points?.map((p) => ({
    latitude: p.latitude,
    longitude: p.longitude,
  })) || [];

  return (
    <View style={styles.container}>
      {/* Carte avec le parcours */}
      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          initialRegion={getMapRegion() || undefined}
          region={getMapRegion() || undefined}
          showsUserLocation
          followsUserLocation={isRunning}
        >
          {/* Parcours à suivre (si disponible) */}
          {route && routeCoordinates.length > 1 && (
            <Polyline
              coordinates={routeCoordinates}
              strokeColor={COLORS.textLight}
              strokeWidth={3}
              lineDashPattern={[5, 5]}
            />
          )}
          
          {/* Tracé réel de la course en temps réel */}
          {trackedPath.length > 1 && (
            <Polyline
              coordinates={trackedPath}
              strokeColor={COLORS.primary}
              strokeWidth={5}
            />
          )}
          
          {/* Point de départ du parcours prévu */}
          {route && route.points && route.points.length > 0 && (
            <Marker
              coordinate={{
                latitude: route.points[0].latitude,
                longitude: route.points[0].longitude,
              }}
              title="Départ prévu"
              pinColor="green"
            />
          )}
          
          {/* Point de départ du tracé réel */}
          {trackedPath.length > 0 && (
            <Marker
              coordinate={trackedPath[0]}
              title="Départ"
              pinColor="blue"
            />
          )}
          
          {/* Point d'arrivée du parcours prévu */}
          {route && route.points && route.points.length > 1 && (
            <Marker
              coordinate={{
                latitude: route.points[route.points.length - 1].latitude,
                longitude: route.points[route.points.length - 1].longitude,
              }}
              title="Arrivée prévue"
              pinColor="red"
            />
          )}
        </MapView>
        {route && (
          <View style={styles.routeInfoOverlay}>
            <Text style={styles.routeInfoText}>{route.title}</Text>
            <Text style={styles.routeInfoSubtext}>{route.distance.toFixed(2)} km</Text>
          </View>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>
          {route ? `Course sur: ${route.title}` : 'Course en cours'}
        </Text>

        <View style={styles.stats}>
          <View style={styles.stat}>
            <MaterialCommunityIcons name="timer" size={24} color="#7D80F4" />
            <Text style={styles.statLabel}>Durée</Text>
            <Text style={styles.statValue}>{formatDuration(duration)}</Text>
          </View>

          <View style={styles.stat}>
            <MaterialCommunityIcons
              name="map-marker-distance"
              size={24}
              color="#7D80F4"
            />
            <Text style={styles.statLabel}>Distance</Text>
            <Text style={styles.statValue}>{formatDistance(distance)}</Text>
          </View>

          <View style={styles.stat}>
            <MaterialCommunityIcons
              name="speedometer"
              size={24}
              color="#7D80F4"
            />
            <Text style={styles.statLabel}>Allure</Text>
            <Text style={styles.statValue}>
              {distance > 0
                ? `${duration / 60 / parseFloat(distance.toFixed(2))} min/km`
                : "--:--"}
            </Text>
          </View>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  mapContainer: {
    height: 300,
    width: '100%',
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  routeInfoOverlay: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  routeInfoText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  routeInfoSubtext: {
    fontSize: 14,
    color: COLORS.textLight,
    marginTop: 4,
  },
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
  card: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
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
  stat: {
    alignItems: "center",
    flex: 1,
  },
  statLabel: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 2,
  },
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
  finishButton: {
    backgroundColor: "#7D80F4",
  },
  cancelButton: {
    backgroundColor: "#f5f5f5",
  },
  buttonText: {
    color: "white",
    fontWeight: "600",
  },
  cancelButtonText: {
    color: "#666",
    fontWeight: "600",
  },
});

