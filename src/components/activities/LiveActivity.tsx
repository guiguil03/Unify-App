import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  AppState,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocation } from "../../hooks/useLocation";
import { formatDuration, formatDistance } from "../../utils/format";
import { LiveActivityService } from "../../services/LiveActivityService";
import { RunnersService } from "../../services/RunnersService";

interface LiveActivityProps {
  onFinish: (activity: {
    distance: number;
    duration: string;
    date: string;
  }) => void;
  onCancel: () => void;
}

export function LiveActivity({ onFinish, onCancel }: LiveActivityProps) {
  const [isRunning, setIsRunning] = useState(true);
  const [startTime] = useState(new Date());
  const [duration, setDuration] = useState(0);
  const [distance, setDistance] = useState(0);
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
      RunnersService.deactivateRunner().catch(error => {
        console.error('Erreur lors de la désactivation du coureur:', error);
      });
    };
  }, []);

  // Activer le coureur quand la location est disponible
  useEffect(() => {
    const activateRunner = async () => {
      if (isRunning) {
        // Essayer d'obtenir la location si elle n'est pas encore disponible
        let currentLocation = location;
        if (!currentLocation) {
          console.log('Location non disponible, tentative de refresh...');
          currentLocation = await refreshLocation();
        }
        
        if (currentLocation) {
          try {
            console.log('Activation du coureur avec position:', currentLocation);
            await RunnersService.updateRunnerPosition({
              latitude: currentLocation.latitude,
              longitude: currentLocation.longitude,
              distance: 0,
              pace: '--:--',
              isActive: true,
            });
            previousLocationRef.current = { ...currentLocation };
            console.log('✅ Coureur activé avec succès dans la table runners');
          } catch (error) {
            console.error('❌ Erreur lors de l\'activation du coureur:', error);
            if (error instanceof Error) {
              console.error('Détails de l\'erreur:', error.message, error.stack);
            }
          }
        } else {
          console.warn('⚠️ Impossible d\'obtenir la location pour activer le coureur');
        }
      }
    };
    activateRunner();
  }, [location, isRunning, refreshLocation]);

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
      console.log('Démarrage de la mise à jour périodique de la position');
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

            console.log('Mise à jour position coureur:', {
              lat: currentLocation.latitude,
              lon: currentLocation.longitude,
              distance: currentDistance,
              pace: paceFormatted
            });

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

            previousLocationRef.current = { ...currentLocation };
          }
        } catch (error) {
          console.error('Erreur lors de la mise à jour de la position:', error);
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
      console.error('Erreur lors de la désactivation du coureur:', error);
    }

    const activity = {
      distance: parseFloat(distance.toFixed(2)),
      duration: formatDuration(duration),
      date: new Date().toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
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
      console.error('Erreur lors de la désactivation du coureur:', error);
    }
    
    onCancel();
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Course en cours</Text>

        <View style={styles.stats}>
          <View style={styles.stat}>
            <MaterialCommunityIcons name="timer" size={24} color="#E83D4D" />
            <Text style={styles.statLabel}>Durée</Text>
            <Text style={styles.statValue}>{formatDuration(duration)}</Text>
          </View>

          <View style={styles.stat}>
            <MaterialCommunityIcons
              name="map-marker-distance"
              size={24}
              color="#E83D4D"
            />
            <Text style={styles.statLabel}>Distance</Text>
            <Text style={styles.statValue}>{formatDistance(distance)}</Text>
          </View>

          <View style={styles.stat}>
            <MaterialCommunityIcons
              name="speedometer"
              size={24}
              color="#E83D4D"
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
    padding: 16,
    backgroundColor: "white",
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
    backgroundColor: "#E83D4D",
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
