import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ProfileStats as ProfileStatsType } from "../../types/profile";

interface ProfileStatsProps {
  stats: ProfileStatsType;
}

export function ProfileStats({ stats }: ProfileStatsProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Statistiques</Text>
      <View style={styles.grid}>
        <StatItem
          icon="map-marker-distance"
          label="Distance totale"
          value={`${stats.totalDistance} km`}
        />
        <StatItem
          icon="clock-outline"
          label="Temps total"
          value={stats.totalTime}
        />
        <StatItem
          icon="run"
          label="Sessions"
          value={stats.sessions.toString()}
        />
        <StatItem
          icon="speedometer"
          label="Allure moyenne"
          value={stats.averagePace}
        />
      </View>
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
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  statItem: {
    flex: 1,
    minWidth: "45%",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
  },
  label: {
    fontSize: 14,
    color: "#666",
    marginTop: 8,
  },
  value: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 4,
  },
});
