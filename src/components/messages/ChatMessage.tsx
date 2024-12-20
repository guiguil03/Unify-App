import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { ChatMessage as ChatMessageType } from "../../types/message";
import { COLORS } from "../../constants/colors";

interface ChatMessageProps {
  message: ChatMessageType;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isOwnMessage = message.senderId === "currentUser";

  return (
    <View
      style={[
        styles.container,
        isOwnMessage ? styles.ownMessage : styles.otherMessage,
      ]}
    >
      <Text
        style={[styles.text, isOwnMessage ? styles.ownText : styles.otherText]}
      >
        {message.content}
      </Text>
      <Text style={styles.time}>{message.time}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    maxWidth: "80%",
    marginBottom: 12,
    padding: 12,
    borderRadius: 16,
  },
  ownMessage: {
    alignSelf: "flex-end",
    backgroundColor: COLORS.primary,
  },
  otherMessage: {
    alignSelf: "flex-start",
    backgroundColor: COLORS.backgroundLight,
  },
  text: {
    fontSize: 16,
  },
  ownText: {
    color: COLORS.background,
  },
  otherText: {
    color: COLORS.text,
  },
  time: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 4,
    textAlign: "right",
  },
});
