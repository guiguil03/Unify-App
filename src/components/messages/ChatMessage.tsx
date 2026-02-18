import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ChatMessage as ChatMessageType } from "../../types/message";
import { COLORS } from "../../constants/colors";
import { useAuth } from "../../contexts/AuthContext";

interface ChatMessageProps {
  message: ChatMessageType;
  senderName?: string;
  contactAvatar?: string;
  currentUserAvatar?: string;
}

export function ChatMessage({ message, senderName, contactAvatar, currentUserAvatar }: ChatMessageProps) {
  const { user } = useAuth();
  const isOwnMessage = message.senderId === user?.id || message.senderId === "currentUser";

  return (
    <View style={[styles.row, isOwnMessage ? styles.rowOwn : styles.rowOther]}>
      {/* Avatar contact — à gauche des messages reçus */}
      {!isOwnMessage && (
        <View style={styles.avatarContainer}>
          {contactAvatar ? (
            <Image source={{ uri: contactAvatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <MaterialCommunityIcons name="account" size={18} color={COLORS.primary} />
            </View>
          )}
        </View>
      )}

      <View style={[styles.bubbleWrapper, isOwnMessage ? styles.bubbleWrapperOwn : styles.bubbleWrapperOther]}>
        {senderName && !isOwnMessage && (
          <Text style={styles.senderName}>{senderName}</Text>
        )}
        <View style={[styles.bubble, isOwnMessage ? styles.ownMessage : styles.otherMessage]}>
          <Text style={[styles.text, isOwnMessage ? styles.ownText : styles.otherText]} selectable>
            {message.content}
          </Text>
          <Text style={[styles.time, isOwnMessage ? styles.ownTime : styles.otherTime]}>
            {message.time}
          </Text>
        </View>
      </View>

      {/* Avatar utilisateur courant — à droite des messages envoyés */}
      {isOwnMessage && (
        <View style={styles.avatarContainer}>
          {currentUserAvatar ? (
            <Image source={{ uri: currentUserAvatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholderOwn]}>
              <MaterialCommunityIcons name="account" size={18} color="white" />
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    marginBottom: 10,
    alignItems: "flex-end",
    gap: 8,
  },
  rowOwn: {
    justifyContent: "flex-end",
  },
  rowOther: {
    justifyContent: "flex-start",
  },
  avatarContainer: {
    width: 32,
    height: 32,
    flexShrink: 0,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  avatarPlaceholder: {
    backgroundColor: COLORS.backgroundLight,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarPlaceholderOwn: {
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  bubbleWrapper: {
    maxWidth: "72%",
  },
  bubbleWrapperOwn: {
    alignItems: "flex-end",
  },
  bubbleWrapperOther: {
    alignItems: "flex-start",
  },
  senderName: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.primary,
    marginBottom: 3,
    marginLeft: 4,
  },
  bubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  ownMessage: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
  },
  otherMessage: {
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
