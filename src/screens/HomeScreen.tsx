import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Image,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { NavigationProp } from "../types/navigation";
import { StoriesRow } from "../components/stories/StoriesRow";

// Import du logo
import logo from "../assets/logo.png";

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate("Settings")}>
          <MaterialCommunityIcons name="cog" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Accueil</Text>
        <TouchableOpacity onPress={() => navigation.navigate("Messages")}>
          <MaterialCommunityIcons name="message" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Stories Row */}
        <StoriesRow />

        {/* Main Content */}
        <View style={styles.mainContent}>
          <Image source={logo} style={styles.logo} />
          <Text style={styles.greeting}>Bonjour John</Text>
        </View>
      </View>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate("Home")}
        >
          <MaterialCommunityIcons name="home" size={24} color="#000" />
          <Text style={styles.navText}>Accueil</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate("Map")}
        >
          <MaterialCommunityIcons name="map" size={24} color="#000" />
          <Text style={styles.navText}>Carte</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate("Activities")}
        >
          <MaterialCommunityIcons name="run" size={24} color="#000" />
          <Text style={styles.navText}>Courir</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate("Contacts")}
        >
          <MaterialCommunityIcons name="account-group" size={24} color="#000" />
          <Text style={styles.navText}>Amis</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate("Profile")}
        >
          <MaterialCommunityIcons name="account" size={24} color="#000" />
          <Text style={styles.navText}>Vous</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
  },
  content: {
    flex: 1,
  },
  mainContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 16,
    resizeMode: "contain",
  },
  greeting: {
    fontSize: 18,
    fontWeight: "500",
    marginTop: 16,
  },
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
