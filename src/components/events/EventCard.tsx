import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Event } from "../../types/event";

interface EventCardProps {
  event: Event;
}

export function EventCard({ event }: EventCardProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{event.title}</Text>
        <MaterialCommunityIcons name="calendar" size={24} color="#E83D4D" />
      </View>

      <View style={styles.details}>
        <DetailItem icon="clock-outline" text={event.date} />
        <DetailItem icon="map-marker" text={event.location} />
        <DetailItem
          icon="account-group"
          text={`${event.participants} participants`}
        />
      </View>

      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>S'inscrire</Text>
      </TouchableOpacity>
    </View>
  );
}

interface DetailItemProps {
  icon: string;
  text: string;
}

function DetailItem({ icon, text }: DetailItemProps) {
  return (
    <View style={styles.detailItem}>
      <MaterialCommunityIcons name={icon as any} size={20} color="#E83D4D" />
      <Text style={styles.detailText}>{text}</Text>
    </View>
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
  title: {
    fontSize: 18,
    fontWeight: "600",
  },
  details: {
    gap: 8,
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: "#666",
  },
  button: {
    backgroundColor: "#E83D4D",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});
