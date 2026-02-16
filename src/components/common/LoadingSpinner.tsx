import React from "react";
import { View, ActivityIndicator, Text, StyleSheet, Image } from "react-native";
import { COLORS } from "../../constants/colors";

interface LoadingSpinnerProps {
  message?: string;
}

export function LoadingSpinner({
  message = "Chargement...",
}: LoadingSpinnerProps) {
  return (
    <View style={styles.container}>
      <Image 
        source={require("../../assets/logo.png")} 
        style={styles.logo}
        resizeMode="contain"
      />
      <ActivityIndicator size="large" color={COLORS.primary} style={styles.spinner} />
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
  logo: {
    width: 150,
    height: 150,
    marginBottom: 32,
  },
  spinner: {
    marginTop: 16,
  },
  text: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.textLight,
  },
});
