import React from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

interface LocationLockProps {
  isLocked: boolean;
  onToggleLock: () => void;
  selectedLocation?: string;
}

export function LocationLock({
  isLocked,
  onToggleLock,
  selectedLocation,
}: LocationLockProps) {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.lockButton, isLocked && styles.locked]}
        onPress={onToggleLock}
      >
        <MaterialCommunityIcons
          name={isLocked ? "lock" : "lock-open"}
          size={20}
          color={isLocked ? "#fff" : "#666"}
        />
        <Text style={[styles.lockText, isLocked && styles.lockedText]}>
          {isLocked ? "Position verrouillée" : "Verrouiller la position"}
        </Text>
      </TouchableOpacity>
      {isLocked && selectedLocation && (
        <Text style={styles.location} numberOfLines={1}>
          {selectedLocation}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: Platform.OS === "ios" ? 120 : 100,
    left: 16,
    right: 16,
  },
  lockButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    padding: 12,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    gap: 8,
  },
  locked: {
    backgroundColor: "#E83D4D",
  },
  lockText: {
    fontSize: 14,
    color: "#666",
  },
  lockedText: {
    color: "white",
  },
  location: {
    marginTop: 8,
    fontSize: 12,
    color: "#666",
    backgroundColor: "white",
    padding: 8,
    borderRadius: 4,
  },
});
