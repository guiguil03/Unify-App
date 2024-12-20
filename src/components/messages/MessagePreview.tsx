import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Message } from "../../types/message";

interface MessagePreviewProps {
  message: Message;
  onPress: () => void;
}

export function MessagePreview({ message, onPress }: MessagePreviewProps) {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.avatar}>
        <MaterialCommunityIcons name="account" size={32} color="#E83D4D" />
      </View>

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.name}>{message.contactName}</Text>
          <Text style={styles.time}>{message.time}</Text>
        </View>
        <Text style={styles.preview} numberOfLines={1}>
          {message.lastMessage}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    padding: 16,
    backgroundColor: "white",
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
  },
  time: {
    fontSize: 12,
    color: "#666",
  },
  preview: {
    fontSize: 14,
    color: "#666",
  },
});
