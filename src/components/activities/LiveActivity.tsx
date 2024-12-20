import React, { useState, useEffect } from "react";
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
  const { location } = useLocation();

  useEffect(() => {
    const setupLiveActivity = async () => {
      await LiveActivityService.startActivity();
    };
    setupLiveActivity();

    return () => {
      LiveActivityService.stopActivity();
    };
  }, []);

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
    await LiveActivityService.stopActivity();
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
    await LiveActivityService.stopActivity();
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
