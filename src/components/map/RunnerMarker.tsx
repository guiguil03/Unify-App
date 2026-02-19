import React, { useState, useEffect } from "react";
import { View, Image, Text, StyleSheet } from "react-native";
import { Marker } from "react-native-maps";
import { Runner } from "../../types/runner";
import { MAP_STYLES } from "../../services/map/config";

interface RunnerMarkerProps {
  runner: Runner;
  isSelected: boolean;
  onPress: () => void;
}

export function RunnerMarker({ runner, isSelected, onPress }: RunnerMarkerProps) {
  const [imageLoaded, setImageLoaded] = useState(false);

  // Sur Android, avoir trop de markers avec tracksViewChanges=true simultanément
  // peut crasher le Maps SDK natif. On limite la fenêtre de tracking à 600ms max.
  useEffect(() => {
    if (!runner.avatar || imageLoaded) return;
    const timer = setTimeout(() => setImageLoaded(true), 600);
    return () => clearTimeout(timer);
  }, [runner.avatar, imageLoaded]);

  const isActive = runner.isActive !== false;
  const size = isSelected ? 52 : 42;
  const borderColor = isSelected ? MAP_STYLES.SELECTED_MARKER : "white";
  const borderWidth = isSelected ? 3 : 2.5;

  const initials = runner.name
    .split(" ")
    .map((w) => w[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <Marker
      coordinate={runner.location}
      onPress={onPress}
      anchor={{ x: 0.5, y: 0.5 }}
      tracksViewChanges={runner.avatar ? !imageLoaded : false}
      zIndex={2000}
      tappable={true}
    >
      <View style={styles.wrapper}>
        {/* Halo animé quand sélectionné */}
        {isSelected && (
          <View
            style={[
              styles.halo,
              {
                width: size + 20,
                height: size + 20,
                borderRadius: (size + 20) / 2,
              },
            ]}
          />
        )}

        {/* Anneau coloré */}
        <View
          style={[
            styles.ring,
            {
              width: size + borderWidth * 2,
              height: size + borderWidth * 2,
              borderRadius: (size + borderWidth * 2) / 2,
              borderColor,
              borderWidth,
              shadowOpacity: isSelected ? 0.4 : 0.18,
              elevation: isSelected ? 8 : 4,
            },
          ]}
        >
          {runner.avatar ? (
            <Image
              source={{ uri: runner.avatar }}
              style={{
                width: size,
                height: size,
                borderRadius: size / 2,
                backgroundColor: "#e0e0e0",
              }}
              onLoad={() => setImageLoaded(true)}
            />
          ) : (
            <View
              style={[
                styles.initialsContainer,
                { width: size, height: size, borderRadius: size / 2 },
              ]}
            >
              <Text style={[styles.initials, { fontSize: Math.round(size * 0.34) }]}>
                {initials}
              </Text>
            </View>
          )}
        </View>

        {/* Point de statut (actif = vert / hors ligne = gris) */}
        <View
          style={[
            styles.statusDot,
            { backgroundColor: isActive ? "#4CAF50" : "#9E9E9E" },
          ]}
        />
      </View>
    </Marker>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
  halo: {
    position: "absolute",
    backgroundColor: MAP_STYLES.SELECTED_MARKER + "22",
    borderWidth: 1.5,
    borderColor: MAP_STYLES.SELECTED_MARKER + "66",
  },
  ring: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
  },
  initialsContainer: {
    backgroundColor: MAP_STYLES.SELECTED_MARKER,
    justifyContent: "center",
    alignItems: "center",
  },
  initials: {
    color: "white",
    fontWeight: "700",
  },
  statusDot: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "white",
  },
});
