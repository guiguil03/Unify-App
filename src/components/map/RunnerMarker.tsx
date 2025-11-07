import React from "react";
import { Marker } from "react-native-maps";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Runner } from "../../types/runner";
import { MAP_STYLES } from "../../services/map/config";
import { formatDistance, formatRelativeTime } from "../../utils/format";

interface RunnerMarkerProps {
  runner: Runner;
  isSelected: boolean;
  onPress: () => void;
}

export function RunnerMarker({
  runner,
  isSelected,
  onPress,
}: RunnerMarkerProps) {
  const getMarkerColor = () => {
    if (isSelected) {
      return MAP_STYLES.SELECTED_MARKER;
    }
    if (runner.isActive === false) {
      return MAP_STYLES.INACTIVE_MARKER;
    }
    return MAP_STYLES.DEFAULT_MARKER;
  };

  const statusLabel = runner.isActive
    ? "Connecté(e)"
    : runner.lastSeen
    ? `Hors ligne · ${formatRelativeTime(runner.lastSeen)}`
    : "Hors ligne";

  return (
    <Marker
      coordinate={runner.location}
      onPress={onPress}
      title={runner.name}
      description={`${formatDistance(runner.distance)} · ${runner.pace || "Allure inconnue"} · ${statusLabel}`}
    >
      <MaterialCommunityIcons
        name="run"
        size={24}
        color={getMarkerColor()}
      />
    </Marker>
  );
}
