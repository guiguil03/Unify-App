import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NavigationProp } from "../../types/navigation";

export function BottomNav() {
  const navigation = useNavigation<NavigationProp>();

  return (
    <View style={styles.bottomNav}>
      <TouchableOpacity
        style={styles.navItem}
        onPress={() => navigation.navigate("Home")}
      >
        <MaterialCommunityIcons name="home" size={24} color="#7D80F4" />
        <Text style={styles.navText}>Accueil</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.navItem}
        onPress={() => navigation.navigate("Map")}
      >
        <MaterialCommunityIcons name="map" size={24} color="#7D80F4" />
        <Text style={styles.navText}>Carte</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.navItem}
        onPress={() => navigation.navigate("Activities")}
      >
        <MaterialCommunityIcons name="run" size={24} color="#7D80F4" />
        <Text style={styles.navText}>Courir</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.navItem}
        onPress={() => navigation.navigate("Contacts")}
      >
        <MaterialCommunityIcons name="account-group" size={24} color="#7D80F4" />
        <Text style={styles.navText}>Amis</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.navItem}
        onPress={() => navigation.navigate("Profile")}
      >
        <MaterialCommunityIcons name="account" size={24} color="#7D80F4" />
        <Text style={styles.navText}>Vous</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  bottomNav: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 12,
    paddingBottom: 20,
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

