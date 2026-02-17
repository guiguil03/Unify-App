import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { ChatMessage as ChatMessageType } from "../../types/message";
import { COLORS } from "../../constants/colors";
import { useAuth } from "../../contexts/AuthContext";

interface ChatMessageProps {
  message: ChatMessageType;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const { user } = useAuth();
  // Vérifier si c'est le message de l'utilisateur actuel
  const isOwnMessage = message.senderId === user?.id || message.senderId === "currentUser";

  return (
    <View
      style={[
        styles.container,
        isOwnMessage ? styles.ownMessage : styles.otherMessage,
      ]}
    >
      <Text
        style={[styles.text, isOwnMessage ? styles.ownText : styles.otherText]}
        selectable
      >
        {message.content}
      </Text>
      <Text style={[styles.time, isOwnMessage ? styles.ownTime : styles.otherTime]}>
        {message.time}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    maxWidth: "75%",
    marginBottom: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  ownMessage: {
    alignSelf: "flex-end",
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
  },
  otherMessage: {
    alignSelf: "flex-start",
    backgroundColor: COLORS.backgroundLight,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  text: {
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: 0.2,
  },
  ownText: {
    color: COLORS.background,
    fontWeight: "400",
  },
  otherText: {
    color: COLORS.text,
    fontWeight: "400",
  },
  time: {
    fontSize: 11,
    marginTop: 6,
    opacity: 0.7,
  },
  ownTime: {
    color: COLORS.background,
    textAlign: "right",
  },
  otherTime: {
    color: COLORS.textLight,
    textAlign: "left",
  },
});
