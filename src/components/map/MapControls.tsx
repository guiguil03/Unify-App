import React from "react";
import { View, TouchableOpacity, StyleSheet, Platform } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

interface MapControlsProps {
  onRecenterPress: () => void;
  onSettingsPress: () => void;
}

export function MapControls({
  onRecenterPress,
  onSettingsPress,
}: MapControlsProps) {
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.button} onPress={onSettingsPress}>
        <MaterialCommunityIcons name="map-search" size={24} color="#E83D4D" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={onRecenterPress}>
        <MaterialCommunityIcons
          name="crosshairs-gps"
          size={24}
          color="#E83D4D"
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    right: 16,
    top: Platform.OS === "ios" ? 90 : 70,
    flexDirection: "row",
    gap: 8,
  },
  button: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});
