import React from "react";
import { View, Text, StyleSheet, SafeAreaView, Image } from "react-native";
import { StoriesRow } from "../components/stories/StoriesRow";
import { ScreenHeader } from "../components/common/ScreenHeader";
import { BottomNav } from "../components/common/BottomNav";

// Import du logo
import logo from "../assets/logo.png";

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title="Accueil" showSearch />

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

      <BottomNav />

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
  },
  content: {
    flex: 1,
    paddingBottom: 80,
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
});
