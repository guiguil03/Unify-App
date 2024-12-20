import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { COLORS } from "../../../constants/colors";
import { StoriesRow } from "../../../components/stories/StoriesRow";

export function Content() {
  return (
    <View style={styles.content}>
      <StoriesRow />
      <View style={styles.welcomeContainer}>
        <MaterialCommunityIcons
          name="run-fast"
          size={80}
          color={COLORS.primary}
        />
        <Text style={styles.appName}>Unify</Text>
        <Text style={styles.welcomeText}>
          Bienvenue, <Text style={styles.username}>John</Text>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingTop: 12,
  },
  welcomeContainer: {
    alignItems: "center",
    gap: 16,
    flex: 1,
    justifyContent: "center",
  },
  appName: {
    fontSize: 36,
    fontWeight: "bold",
    color: COLORS.primary,
    marginTop: 8,
  },
  welcomeText: {
    fontSize: 24,
    color: COLORS.textLight,
  },
  username: {
    fontWeight: "600",
    color: COLORS.text,
  },
});