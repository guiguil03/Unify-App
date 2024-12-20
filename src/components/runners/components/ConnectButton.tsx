import React from "react";
import { TouchableOpacity, View, Text, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

interface ConnectButtonProps {
  isConnected: boolean;
  onConnect: () => void;
}

export function ConnectButton({ isConnected, onConnect }: ConnectButtonProps) {
  if (isConnected) {
    return (
      <View style={styles.connectedContainer}>
        <MaterialCommunityIcons name="check-circle" size={24} color="#4CAF50" />
        <Text style={styles.connectedText}>Connectés</Text>
      </View>
    );
  }

  return (
    <TouchableOpacity style={styles.connectButton} onPress={onConnect}>
      <MaterialCommunityIcons name="account-plus" size={24} color="white" />
      <Text style={styles.connectButtonText}>Se connecter</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  connectButton: {
    backgroundColor: "#E83D4D",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 8,
    gap: 8,
  },
  connectButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  connectedContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  connectedText: {
    fontSize: 16,
    color: "#4CAF50",
    fontWeight: "600",
  },
});
