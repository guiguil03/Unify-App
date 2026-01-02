import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useMapScreen } from "./hooks/useMapScreen";
import { MapContent } from "./components/MapContent";
import { MapOverlays } from "./components/MapOverlays";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { BottomNav } from "../../components/common/BottomNav";
import { NavigationProp } from "../../types/navigation";
import { COLORS } from "../../constants/colors";

export default function MapScreen() {
  const navigation = useNavigation<NavigationProp>();
  const {
    state,
    handlers,
    refs,
    loading,
  } = useMapScreen();

  if (loading || !state.location) {
    return <LoadingSpinner message="Chargement de la carte..." />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.mapContainer}>
        <MapContent
          mapRef={refs.mapRef}
          state={state}
          handlers={handlers}
        />
        <MapOverlays
          state={state}
          handlers={handlers}
        />
        
        {/* Bouton flottant pour accéder aux parcours */}
        <TouchableOpacity
          style={styles.routesButton}
          onPress={() => navigation.navigate("Routes")}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="map-marker-path" size={24} color="white" />
        </TouchableOpacity>
      </View>
      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  mapContainer: {
    flex: 1,
    paddingBottom: 80,
  },
  routesButton: {
    position: "absolute",
    bottom: 100,
    right: 20,
    backgroundColor: COLORS.primary,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});