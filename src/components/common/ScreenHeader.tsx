import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NavigationProp } from "../../types/navigation";

interface ScreenHeaderProps {
  title: string;
  showSearch?: boolean;
}

export function ScreenHeader({ title, showSearch = false }: ScreenHeaderProps) {
  const navigation = useNavigation<NavigationProp>();

  return (
    <View style={styles.container}>
      <View style={[styles.topRow, showSearch && styles.topRowWithSearch]}>
        <TouchableOpacity
          style={styles.circleButton}
          onPress={() => navigation.navigate("Settings")}
        >
          <MaterialCommunityIcons name="cog" size={28} color="#7D80F4" />
        </TouchableOpacity>

        <View style={styles.centerPill}>
          <Text style={styles.centerPillText}>{title}</Text>
        </View>

        <TouchableOpacity
          style={styles.circleButton}
          onPress={() => navigation.navigate("Messages")}
        >
          <MaterialCommunityIcons name="message" size={28} color="#7D80F4" />
        </TouchableOpacity>
      </View>

      {showSearch && (
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher..."
            placeholderTextColor="#C5C6FF"
          />
          <MaterialCommunityIcons
            name="magnify"
            size={26}
            color="#C5C6FF"
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: "#FFFFFF",
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  topRowWithSearch: {
    marginBottom: 16,
  },
  circleButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  centerPill: {
    paddingHorizontal: 32,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  centerPillText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#7D80F4",
  },
  searchContainer: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#C5C6FF",
    borderRadius: 32,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#7D80F4",
    marginRight: 8,
  },
});


