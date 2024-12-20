import React from "react";
import { View, ActivityIndicator, Text, StyleSheet } from "react-native";
import { COLORS } from "../../constants/colors";

interface LoadingSpinnerProps {
  message?: string;
}

export function LoadingSpinner({
  message = "Chargement...",
}: LoadingSpinnerProps) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={COLORS.primary} />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
  text: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.textLight,
  },
});
