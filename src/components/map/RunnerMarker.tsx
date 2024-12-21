import React from "react";
import { Marker } from "react-native-maps";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Runner } from "../../types/runner";
import { MAP_STYLES } from "../../services/map/config";
import { formatDistance } from "../../utils/format";

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
  return (
    <Marker
      coordinate={runner.location}
      onPress={onPress}
      title={runner.name}
      description={`${formatDistance(runner.distance)} - ${runner.pace}`}
    >
      <MaterialCommunityIcons
        name="run"
        size={24}
        color={
          isSelected ? MAP_STYLES.SELECTED_MARKER : MAP_STYLES.DEFAULT_MARKER
        }
      />
    </Marker>
  );
}
