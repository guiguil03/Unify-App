import React, { useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Text,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useGroupChat } from '../hooks/useGroupChat';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { COLORS } from '../constants/colors';
import { GroupMessage } from '../types/groupChat';
import { useAuth } from '../contexts/AuthContext';

export default function GroupChatScreen({
  route,
}: {
  route: { params: { groupChatId: string; groupName: string } };
}) {
  const { groupChatId } = route.params;
  const { messages, loading, sendMessage } = useGroupChat(groupChatId);
  const { user } = useAuth();
  const [newMessage, setNewMessage] = React.useState('');
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 300);
  }, []);

  const handleSend = () => {
    if (newMessage.trim()) {
      sendMessage(newMessage.trim());
      setNewMessage('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Chargement de la conversation..." />;
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <GroupMessageBubble message={item} isOwn={item.senderId === user?.id} />
        )}
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
          style={[styles.sendButton, !newMessage.trim() && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!newMessage.trim()}
        >
          <MaterialCommunityIcons
            name="send"
            size={22}
            color={newMessage.trim() ? 'white' : COLORS.textLight}
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

function GroupMessageBubble({
  message,
  isOwn,
}: {
  message: GroupMessage;
  isOwn: boolean;
}) {
  return (
    <View style={[styles.bubbleWrapper, isOwn ? styles.wrapperOwn : styles.wrapperOther]}>
      {!isOwn && (
        <View style={styles.avatarSmall}>
          {message.senderAvatar ? (
            <Image source={{ uri: message.senderAvatar }} style={styles.avatarImg} />
          ) : (
            <MaterialCommunityIcons name="account" size={18} color={COLORS.primary} />
          )}
        </View>
      )}
      <View style={styles.bubbleColumn}>
        {!isOwn && (
          <Text style={styles.senderName}>{message.senderName}</Text>
        )}
        <View style={[styles.bubble, isOwn ? styles.ownBubble : styles.otherBubble]}>
          <Text style={[styles.bubbleText, isOwn ? styles.ownText : styles.otherText]}>
            {message.content}
          </Text>
          <Text style={[styles.time, isOwn ? styles.ownTime : styles.otherTime]}>
            {message.time}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  messagesList: {
    padding: 16,
    paddingBottom: 8,
  },
  bubbleWrapper: {
    flexDirection: 'row',
    marginBottom: 10,
    alignItems: 'flex-end',
    gap: 8,
  },
  wrapperOwn: {
    justifyContent: 'flex-end',
  },
  wrapperOther: {
    justifyContent: 'flex-start',
  },
  avatarSmall: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImg: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  bubbleColumn: {
    maxWidth: '75%',
  },
  senderName: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 3,
    marginLeft: 4,
  },
  bubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  ownBubble: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
    alignSelf: 'flex-end',
  },
  otherBubble: {
    backgroundColor: COLORS.backgroundLight,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignSelf: 'flex-start',
  },
  bubbleText: {
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: 0.2,
  },
  ownText: {
    color: COLORS.background,
  },
  otherText: {
    color: COLORS.text,
  },
  time: {
    fontSize: 11,
    marginTop: 6,
    opacity: 0.7,
  },
  ownTime: {
    color: COLORS.background,
    textAlign: 'right',
  },
  otherTime: {
    color: COLORS.textLight,
    textAlign: 'left',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    paddingBottom: Platform.OS === 'ios' ? 20 : 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.background,
    alignItems: 'flex-end',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 5,
  },
  inputWrapper: {
    flex: 1,
    position: 'relative',
  },
  input: {
    backgroundColor: COLORS.backgroundLight,
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.text,
    minHeight: 48,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: COLORS.border,
    lineHeight: 22,
  },
  charCount: {
    position: 'absolute',
    bottom: 8,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  charCountText: {
    fontSize: 10,
    color: 'white',
    fontWeight: '600',
  },
  sendButton: {
    backgroundColor: COLORS.primary,
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
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
