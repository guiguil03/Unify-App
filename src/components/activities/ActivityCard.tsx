import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Activity } from "../../types/activity";
import { ActivityStats } from "./ActivityStats";

interface ActivityCardProps {
  activity: Activity;
  onPress: (activity: Activity) => void;
}

export function ActivityCard({ activity, onPress }: ActivityCardProps) {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress(activity)}
    >
      <View style={styles.header}>
        <Text style={styles.date}>{activity.date}</Text>
        <MaterialCommunityIcons name="run" size={24} color="#E83D4D" />
      </View>

      <ActivityStats activity={activity} />

      <View style={styles.footer}>
        <MaterialCommunityIcons name="chevron-right" size={24} color="#666" />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  date: {
    fontSize: 16,
    fontWeight: "600",
  },
  footer: {
    alignItems: "center",
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    paddingTop: 12,
  },
});
