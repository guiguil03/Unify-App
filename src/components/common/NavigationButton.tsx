import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";
import Icon from "@expo/vector-icons/MaterialCommunityIcons";

interface NavigationButtonProps {
  title: string;
  onPress: () => void;
  icon: string;
}

export const NavigationButton: React.FC<NavigationButtonProps> = ({
  title,
  onPress,
  icon,
}) => (
  <TouchableOpacity style={styles.button} onPress={onPress}>
    <Icon name={icon} size={24} color="white" />
    <Text style={styles.text}>{title}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  button: {
    backgroundColor: "#E83D4D",
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
