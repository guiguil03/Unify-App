import React from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { useMessages } from '../hooks/useMessages';
import { MessagePreview } from '../components/messages/MessagePreview';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { useNavigation } from '@react-navigation/native';
import { NavigationProp } from '../types/navigation';

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
});