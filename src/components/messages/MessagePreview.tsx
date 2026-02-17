import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Message } from "../../types/message";
import { COLORS } from "../../constants/colors";

interface MessagePreviewProps {
  message: Message;
  onPress: () => void;
}

export function MessagePreview({ message, onPress }: MessagePreviewProps) {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      {message.contactAvatar ? (
        <Image source={{ uri: message.contactAvatar }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.avatarPlaceholder]}>
          <MaterialCommunityIcons name="account" size={32} color={COLORS.primary} />
        </View>
      )}

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.name} numberOfLines={1}>{message.contactName}</Text>
          <Text style={styles.time}>{message.time}</Text>
        </View>
        <View style={styles.messageContainer}>
          <Text style={styles.preview} numberOfLines={2}>
            {message.lastMessage || "Aucun message"}
          </Text>
          {message.lastMessage && (
            <MaterialCommunityIcons 
              name="chevron-right" 
              size={20} 
              color={COLORS.textLight} 
              style={styles.chevron}
            />
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    padding: 16,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 14,
  },
  avatarPlaceholder: {
    backgroundColor: COLORS.backgroundLight,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
    justifyContent: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  name: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.text,
    flex: 1,
    marginRight: 8,
  },
  time: {
    fontSize: 12,
    color: COLORS.textLight,
    fontWeight: "500",
  },
  messageContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  preview: {
    flex: 1,
    fontSize: 15,
    color: COLORS.textLight,
    lineHeight: 20,
  },
  chevron: {
    opacity: 0.5,
  },
});
