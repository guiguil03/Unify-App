import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { COLORS } from "../../constants/colors";

interface ButtonProps {
  title: string;
  onPress: () => void;
  icon: string;
}

export function Button({ title, onPress, icon }: ButtonProps) {
  return (
    <TouchableOpacity style={styles.button} onPress={onPress}>
      <MaterialCommunityIcons name={icon as any} size={24} color="white" />
      <Text style={styles.text}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  text: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});
