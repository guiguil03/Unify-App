import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { NavigationProp } from "../../../types/navigation";

const NAV_ITEMS = [
  { name: "Home", icon: "home", label: "Accueil" },
  { name: "Map", icon: "map", label: "Carte" },
  { name: "Activities", icon: "run", label: "Courir" },
  { name: "Contacts", icon: "account-group", label: "Amis" },
  { name: "Profile", icon: "account", label: "Vous" },
] as const;

export function BottomNavigation() {
  const navigation = useNavigation<NavigationProp>();

  return (
    <View style={styles.bottomNav}>
      {NAV_ITEMS.map((item) => (
        <TouchableOpacity
          key={item.name}
          style={styles.navItem}
          onPress={() => navigation.navigate(item.name)}
        >
          <MaterialCommunityIcons name={item.icon} size={24} color="#000" />
          <Text style={styles.navText}>{item.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 12,
    backgroundColor: "#f5f5f5",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  navItem: {
    alignItems: "center",
  },
  navText: {
    fontSize: 12,
    marginTop: 4,
  },
});
