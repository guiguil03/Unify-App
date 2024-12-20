import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

interface RunnerStatsProps {
  pace: string;
  distance: number;
}

export function RunnerStats({ pace, distance }: RunnerStatsProps) {
  return (
    <View style={styles.stats}>
      <StatItem icon="speedometer" label="Allure moyenne" value={pace} />
      <StatItem
        icon="map-marker-distance"
        label="Distance"
        value={`${distance} km`}
      />
    </View>
  );
}

interface StatItemProps {
  icon: string;
  label: string;
  value: string;
}

function StatItem({ icon, label, value }: StatItemProps) {
  return (
    <View style={styles.statItem}>
      <MaterialCommunityIcons name={icon as any} size={24} color="#E83D4D" />
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  stats: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 24,
  },
  statItem: {
    alignItems: "center",
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 2,
  },
});
