import React, { useState } from "react";
import { TouchableOpacity, View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ContactRelationshipStatus } from "../../../types/contact";

interface ConnectButtonProps {
  status?: ContactRelationshipStatus | 'none';
  onConnect: () => void | Promise<void>;
}

export function ConnectButton({ status = 'none', onConnect }: ConnectButtonProps) {
  const [isConnecting, setIsConnecting] = useState(false);

  const handlePress = async () => {
    if (isConnecting) return;
    
    setIsConnecting(true);
    try {
      await onConnect();
    } catch (error) {
      if (__DEV__) console.error('Connect failed:', error);
    } finally {
      // Ne pas réinitialiser immédiatement pour éviter les clics multiples
      setTimeout(() => {
        setIsConnecting(false);
      }, 1000);
    }
  };

  if (status === 'friends') {
    return (
      <View style={[styles.statusContainer, styles.friendsContainer]}>
        <MaterialCommunityIcons name="check-circle" size={24} color="#4CAF50" />
        <Text style={[styles.statusText, styles.friendsText]}>Déjà amis</Text>
      </View>
    );
  }

  if (status === 'pending') {
    return (
      <View style={[styles.statusContainer, styles.pendingContainer]}>
        <MaterialCommunityIcons name="clock-outline" size={24} color="#FFA000" />
        <Text style={[styles.statusText, styles.pendingText]}>Demande envoyée</Text>
      </View>
    );
  }

  if (status === 'incoming') {
    return (
      <View style={[styles.statusContainer, styles.incomingContainer]}>
        <MaterialCommunityIcons name="account-clock" size={24} color="#03A9F4" />
        <Text style={[styles.statusText, styles.incomingText]}>Demande reçue</Text>
      </View>
    );
  }

  return (
    <TouchableOpacity 
      style={[styles.connectButton, isConnecting && styles.connectButtonDisabled]} 
      onPress={handlePress}
      disabled={isConnecting}
      activeOpacity={0.8}
    >
      {isConnecting ? (
        <>
          <ActivityIndicator size="small" color="white" />
          <Text style={styles.connectButtonText}>Connexion...</Text>
        </>
      ) : (
        <>
          <MaterialCommunityIcons name="account-plus" size={24} color="white" />
          <Text style={styles.connectButtonText}>Se connecter</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  connectButton: {
    backgroundColor: "#7D80F4",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 8,
    gap: 8,
    minHeight: 56,
  },
  connectButtonDisabled: {
    opacity: 0.7,
  },
  connectButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 16,
    fontWeight: "600",
  },
  friendsContainer: {
    borderColor: "#C8E6C9",
    backgroundColor: "#E8F5E9",
  },
  friendsText: {
    color: "#2E7D32",
  },
  pendingContainer: {
    borderColor: "#FFE082",
    backgroundColor: "#FFF8E1",
  },
  pendingText: {
    color: "#FF8F00",
  },
  incomingContainer: {
    borderColor: "#B3E5FC",
    backgroundColor: "#E1F5FE",
  },
  incomingText: {
    color: "#0288D1",
  },
});
