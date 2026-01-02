import React from 'react';
import { View, StyleSheet, FlatList, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMessages } from '../hooks/useMessages';
import { MessagePreview } from '../components/messages/MessagePreview';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { useNavigation } from '@react-navigation/native';
import { NavigationProp } from '../types/navigation';
import { COLORS } from '../constants/colors';

export default function MessagesScreen() {
  const { messages, loading, error } = useMessages();
  const navigation = useNavigation<NavigationProp>();

  if (loading) {
    return <LoadingSpinner message="Chargement des messages..." />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  const handleMessagePress = (contactId: string, contactName: string) => {
    navigation.navigate('Chat', { contactId, contactName });
  };

  if (!messages || messages.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconContainer}>
            <MaterialCommunityIcons name="message-outline" size={64} color={COLORS.textLight} />
          </View>
          <Text style={styles.emptyTitle}>Aucun message</Text>
          <Text style={styles.emptyText}>
            Vos conversations s'afficheront ici.{'\n'}
            Commencez une nouvelle conversation avec vos contacts !
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <MessagePreview
            message={item}
            onPress={() => handleMessagePress(item.contactId, item.contactName)}
          />
        )}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  list: {
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textLight,
    textAlign: 'center',
    lineHeight: 24,
  },
});