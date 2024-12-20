import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useContacts } from '../hooks/useContacts';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ContactCard } from '../components/contacts/ContactCard';

export default function ContactsScreen() {
  const { contacts, loading, error } = useContacts();

  const handleChatPress = (contactId: string) => {
    // À implémenter: navigation vers la conversation
    console.log('Chat with contact:', contactId);
  };

  if (loading) {
    return <LoadingSpinner message="Chargement des contacts..." />;
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {contacts.map((contact) => (
          <ContactCard
            key={contact.id}
            contact={contact}
            onChatPress={handleChatPress}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  error: {
    color: 'red',
    textAlign: 'center',
    margin: 16,
  },
});