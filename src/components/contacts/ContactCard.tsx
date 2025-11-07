import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image, Alert } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Contact } from "../../types/contact";
import { COLORS } from "../../constants/colors";

interface ContactCardProps {
  contact: Contact;
  onChatPress: (contactId: string) => void;
  onRemove?: (contactId: string) => void;
}

export function ContactCard({ contact, onChatPress, onRemove }: ContactCardProps) {
  const [showActions, setShowActions] = useState(false);

  const handleLongPress = () => {
    if (onRemove) {
      setShowActions(true);
    }
  };

  const handleRemove = () => {
    Alert.alert(
      'Supprimer le contact',
      `Voulez-vous vraiment supprimer ${contact.name} de vos contacts ?`,
      [
        { text: 'Annuler', style: 'cancel', onPress: () => setShowActions(false) },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            onRemove?.(contact.id);
            setShowActions(false);
          },
        },
      ]
    );
  };

  return (
    <TouchableOpacity 
      style={styles.card}
      onLongPress={handleLongPress}
      delayLongPress={500}
    >
      <View style={styles.contactInfo}>
        {contact.avatar ? (
          <Image source={{ uri: contact.avatar }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <MaterialCommunityIcons name="account" size={24} color="#999" />
          </View>
        )}
        <View style={styles.contactDetails}>
          <Text style={styles.name}>{contact.name}</Text>
          <Text style={styles.lastActivity}>
            Dernière activité: {contact.lastActivity}
          </Text>
        </View>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.chatButton}
          onPress={() => onChatPress(contact.id)}
        >
          <MaterialCommunityIcons name="chat" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        {showActions && onRemove && (
          <TouchableOpacity
            style={styles.removeButton}
            onPress={handleRemove}
          >
            <MaterialCommunityIcons name="delete" size={24} color="#FF5252" />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  contactInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactDetails: {
    marginLeft: 12,
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
    color: '#333',
  },
  lastActivity: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chatButton: {
    padding: 8,
  },
  removeButton: {
    padding: 8,
  },
});
