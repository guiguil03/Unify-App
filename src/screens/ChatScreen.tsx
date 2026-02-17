import React, { useRef, useEffect } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Text,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useChat } from "../hooks/useChat";
import { ChatMessage } from "../components/messages/ChatMessage";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { COLORS } from "../constants/colors";

export default function ChatScreen({ route }: { route: { params: { contactId: string; contactName: string } } }) {
  const { contactId, contactName } = route.params;
  const { messages, loading, sendMessage } = useChat(contactId);
  const [newMessage, setNewMessage] = React.useState("");
  const inputRef = useRef<TextInput>(null);
  const flatListRef = useRef<FlatList>(null);

  // Afficher le dernier message
  const lastMessage = messages.length > 0 ? messages[0] : null;

  const handleSend = () => {
    if (newMessage.trim()) {
      sendMessage(newMessage);
      setNewMessage("");
      // Focus sur l'input après l'envoi
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  };

  useEffect(() => {
    // Focus automatique sur l'input au chargement
    setTimeout(() => {
      inputRef.current?.focus();
    }, 300);
  }, []);

  if (loading) {
    return <LoadingSpinner message="Chargement de la conversation..." />;
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Affichage du dernier message */}
      {lastMessage && (
        <View style={styles.lastMessageContainer}>
          <Text style={styles.lastMessageLabel}>Dernier message :</Text>
          <Text style={styles.lastMessageText} numberOfLines={1}>
            {lastMessage.content}
          </Text>
        </View>
      )}

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ChatMessage message={item} />}
        contentContainerStyle={styles.messagesList}
        inverted
        showsVerticalScrollIndicator={false}
      />

      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <TextInput
            ref={inputRef}
            style={styles.input}
            value={newMessage}
            onChangeText={setNewMessage}
            placeholder="Écrivez votre message..."
            placeholderTextColor={COLORS.textLight}
            multiline
            textAlignVertical="top"
            autoFocus={false}
            maxLength={1000}
          />
          {newMessage.length > 0 && (
            <View style={styles.charCount}>
              <Text style={styles.charCountText}>{newMessage.length}</Text>
            </View>
          )}
        </View>
        <TouchableOpacity 
          style={[
            styles.sendButton, 
            !newMessage.trim() && styles.sendButtonDisabled
          ]} 
          onPress={handleSend}
          disabled={!newMessage.trim()}
        >
          <MaterialCommunityIcons 
            name="send" 
            size={22} 
            color={newMessage.trim() ? "white" : COLORS.textLight} 
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  lastMessageContainer: {
    backgroundColor: COLORS.backgroundLight,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  lastMessageLabel: {
    fontSize: 12,
    color: COLORS.textLight,
    fontWeight: "500",
  },
  lastMessageText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.text,
    fontStyle: "italic",
  },
  messagesList: {
    padding: 16,
    paddingBottom: 8,
  },
  inputContainer: {
    flexDirection: "row",
    padding: 12,
    paddingBottom: Platform.OS === 'ios' ? 20 : 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.background,
    alignItems: "flex-end",
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 5,
  },
  inputWrapper: {
    flex: 1,
    position: "relative",
  },
  input: {
    backgroundColor: COLORS.backgroundLight,
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 12,
    paddingBottom: 12,
    fontSize: 16,
    color: COLORS.text,
    minHeight: 48,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: COLORS.border,
    lineHeight: 22,
  },
  charCount: {
    position: "absolute",
    bottom: 8,
    right: 12,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  charCountText: {
    fontSize: 10,
    color: "white",
    fontWeight: "600",
  },
  sendButton: {
    backgroundColor: COLORS.primary,
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.border,
    shadowOpacity: 0,
  },
});
