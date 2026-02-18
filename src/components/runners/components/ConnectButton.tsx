import React from "react";
import { TouchableOpacity, View, Text, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ContactRelationshipStatus } from "../../../types/contact";

interface ConnectButtonProps {
  status?: ContactRelationshipStatus | 'none';
  onMessage: () => void;
  onConnect?: () => void;
}

export function ConnectButton({ status = 'none', onMessage, onConnect }: ConnectButtonProps) {
  const isFriends = status === 'friends';
  const showConnect = status === 'none';
  const showAccept = status === 'incoming';

  return (
    <View style={styles.wrapper}>
      {/* Badge de statut — affiché uniquement si demande en cours ou amis */}
      {status !== 'none' && (
        <View style={[styles.statusBadge, statusBadgeStyle[status]]}>
          <MaterialCommunityIcons
            name={statusIcon[status]}
            size={14}
            color={statusIconColor[status]}
          />
          <Text style={[styles.statusText, statusTextStyle[status]]}>
            {statusLabel[status]}
          </Text>
        </View>
      )}

      {/* Bouton Se connecter — visible quand pas encore connecté */}
      {showConnect && onConnect && (
        <TouchableOpacity
          style={styles.connectButton}
          onPress={onConnect}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="account-plus" size={20} color="#7D80F4" />
          <Text style={styles.connectButtonText}>Se connecter</Text>
        </TouchableOpacity>
      )}

      {/* Bouton Accepter — visible quand demande reçue */}
      {showAccept && onConnect && (
        <TouchableOpacity
          style={styles.acceptButton}
          onPress={onConnect}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="account-check" size={20} color="white" />
          <Text style={styles.acceptButtonText}>Accepter la demande</Text>
        </TouchableOpacity>
      )}

      {/* Bouton message — toujours visible */}
      <TouchableOpacity
        style={[styles.messageButton, isFriends && styles.messageButtonFriends]}
        onPress={onMessage}
        activeOpacity={0.8}
      >
        <MaterialCommunityIcons name="message-text" size={20} color="white" />
        <Text style={styles.messageButtonText}>Envoyer un message</Text>
      </TouchableOpacity>
    </View>
  );
}

const statusLabel: Record<string, string> = {
  friends: 'Vous êtes amis',
  pending: 'Demande envoyée',
  incoming: 'Demande reçue',
};

const statusIcon: Record<string, any> = {
  friends: 'check-circle',
  pending: 'clock-outline',
  incoming: 'account-clock',
};

const statusIconColor: Record<string, string> = {
  friends: '#2E7D32',
  pending: '#FF8F00',
  incoming: '#0288D1',
};

const statusBadgeStyle: Record<string, object> = {
  friends: { backgroundColor: '#E8F5E9', borderColor: '#C8E6C9' },
  pending: { backgroundColor: '#FFF8E1', borderColor: '#FFE082' },
  incoming: { backgroundColor: '#E1F5FE', borderColor: '#B3E5FC' },
};

const statusTextStyle: Record<string, object> = {
  friends: { color: '#2E7D32' },
  pending: { color: '#FF8F00' },
  incoming: { color: '#0288D1' },
};

const styles = StyleSheet.create({
  wrapper: {
    gap: 10,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
  },
  connectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
    minHeight: 54,
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#7D80F4',
  },
  connectButtonText: {
    color: '#7D80F4',
    fontSize: 16,
    fontWeight: '700',
  },
  acceptButton: {
    backgroundColor: '#2E7D32',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
    minHeight: 54,
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  acceptButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  messageButton: {
    backgroundColor: '#7D80F4',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
    minHeight: 54,
    shadowColor: '#7D80F4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  messageButtonFriends: {
    backgroundColor: '#5a5dd4',
  },
  messageButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
});
