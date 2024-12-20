import React from "react";
import { View, StyleSheet } from "react-native";
import { useMapScreen } from "./hooks/useMapScreen";
import { MapContent } from "./components/MapContent";
import { MapOverlays } from "./components/MapOverlays";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";

export default function MapScreen() {
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
      <MapContent
        mapRef={refs.mapRef}
        state={state}
        handlers={handlers}
      />
      <MapOverlays
        state={state}
        handlers={handlers}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
});