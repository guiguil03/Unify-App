import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image, Alert } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Contact } from "../../types/contact";
import { COLORS } from "../../constants/colors";

interface ContactCardProps {
  contact: Contact;
  onChatPress: (contact: Contact) => void;
  onRemove?: (contact: Contact) => void;
  onAcceptRequest?: (contact: Contact) => void;
  relationshipStatus?: 'friends' | 'pending' | 'incoming' | 'none';
}

export function ContactCard({ contact, onChatPress, onRemove, onAcceptRequest, relationshipStatus = 'friends' }: ContactCardProps) {
  const confirmRemove = () => {
    let title = 'Supprimer le contact';
    let message = `Voulez-vous vraiment supprimer ${contact.name} de vos contacts ?`;

    if (relationshipStatus === 'incoming') {
      title = 'Refuser la demande';
      message = `Voulez-vous refuser la demande de ${contact.name} ?`;
    } else if (relationshipStatus === 'pending') {
      title = 'Annuler la demande';
      message = `Voulez-vous annuler la demande envoyée à ${contact.name} ?`;
    }

    Alert.alert(
      title,
      message,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: relationshipStatus === 'incoming' ? 'Refuser' : relationshipStatus === 'pending' ? 'Annuler' : 'Supprimer',
          style: 'destructive',
          onPress: () => {
            onRemove?.(contact);
          },
        },
      ]
    );
  };

  return (
    <View style={styles.card}>
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
      {relationshipStatus === 'incoming' ? (
        <View style={styles.requestActionsContainer}>
          {onAcceptRequest && (
            <TouchableOpacity
              style={[styles.requestButton, styles.acceptButton]}
              onPress={() => onAcceptRequest(contact)}
            >
              <MaterialCommunityIcons name="check" size={24} color="#fff" />
            </TouchableOpacity>
          )}
          {onRemove && (
            <TouchableOpacity
              style={[styles.requestButton, styles.rejectButton]}
              onPress={confirmRemove}
            >
              <MaterialCommunityIcons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
      ) : relationshipStatus === 'pending' ? (
        <View style={styles.requestActionsContainer}>
          {onRemove && (
            <TouchableOpacity
              style={[styles.requestButton, styles.rejectButton]}
              onPress={confirmRemove}
            >
              <MaterialCommunityIcons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.chatButton}
            onPress={() => onChatPress(contact)}
          >
            <MaterialCommunityIcons name="chat" size={24} color={COLORS.primary} />
          </TouchableOpacity>
          {onRemove && (
            <TouchableOpacity
              style={styles.moreButton}
              onPress={confirmRemove}
            >
              <MaterialCommunityIcons name="dots-horizontal" size={24} color="#666" />
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
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
  moreButton: {
    padding: 8,
  },
  requestActionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  requestButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
  },
  rejectButton: {
    backgroundColor: '#FF5252',
  },
});
