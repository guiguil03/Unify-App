import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
} from "react-native";
import Slider from "@react-native-community/slider";
import { MaterialCommunityIcons } from "@expo/vector-icons";

interface LocationSelectorProps {
  address: string;
  radius: number;
  onRadiusChange: (radius: number) => void;
  onValidate: () => void;
  style?: any;
}

export function LocationSelector({
  address,
  radius,
  onRadiusChange,
  onValidate,
  style,
}: LocationSelectorProps) {
  return (
    <Animated.View style={[styles.container, style]}>
      <View style={styles.addressContainer}>
        <MaterialCommunityIcons name="map-marker" size={20} color="#E83D4D" />
        <Text style={styles.address} numberOfLines={2}>
          {address}
        </Text>
      </View>

      <View style={styles.radiusContainer}>
        <Text style={styles.label}>
          Chercher des coureurs dans un rayon de :
        </Text>
        <View style={styles.sliderContainer}>
          <Slider
            style={styles.slider}
            minimumValue={0.5}
            maximumValue={5}
            step={0.5}
            value={radius}
            onValueChange={onRadiusChange}
            minimumTrackTintColor="#E83D4D"
            maximumTrackTintColor="#ddd"
            thumbTintColor="#E83D4D"
          />
          <Text style={styles.radiusValue}>{radius} km</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.validateButton} onPress={onValidate}>
        <MaterialCommunityIcons name="check" size={20} color="white" />
        <Text style={styles.validateText}>Valider la zone</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 16,
    right: 16,
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 2,
  },
  addressContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 8,
  },
  address: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  radiusContainer: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    color: "#666",
  },
  sliderContainer: {
    alignItems: "center",
  },
  slider: {
    width: "100%",
    height: 40,
  },
  radiusValue: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  validateButton: {
    backgroundColor: "#E83D4D",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    gap: 8,
  },
  validateText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});
