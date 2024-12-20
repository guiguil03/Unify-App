import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Activity } from "../../types/activity";
import { COLORS } from "../../constants/colors";
import { formatDistance } from "../../utils/format";

interface ActivityStatsProps {
  activity: Activity;
}

export function ActivityStats({ activity }: ActivityStatsProps) {
  return (
    <View style={styles.stats}>
      <StatItem
        icon="map-marker-distance"
        label="Distance"
        value={`${formatDistance(activity.distance)}`}
      />
      <StatItem icon="clock-outline" label="Durée" value={activity.duration} />
      <StatItem icon="speedometer" label="Allure" value={activity.pace} />
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
      <MaterialCommunityIcons
        name={icon as any}
        size={20}
        color={COLORS.primary}
      />
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  stats: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statItem: {
    alignItems: "center",
  },
  label: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 4,
  },
  value: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 2,
  },
});
