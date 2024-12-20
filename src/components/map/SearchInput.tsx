import React from "react";
import { View, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

interface SearchInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit: () => void;
  onClear: () => void;
  onFocus?: () => void;
  placeholder?: string;
  showResults?: boolean;
}

export function SearchInput({
  value = "", // Valeur par défaut pour éviter undefined
  onChangeText,
  onSubmit,
  onClear,
  onFocus,
  placeholder = "Rechercher un lieu...",
  showResults = false,
}: SearchInputProps) {
  return (
    <View
      style={[styles.container, showResults && styles.containerWithResults]}
    >
      <MaterialCommunityIcons
        name="magnify"
        size={20}
        color="#666"
        style={styles.searchIcon}
      />
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmit}
        onFocus={onFocus}
        placeholder={placeholder}
        placeholderTextColor="#666"
        returnKeyType="search"
        autoCorrect={false}
      />
      {value?.length > 0 && ( // Ajout de l'opérateur optionnel
        <TouchableOpacity onPress={onClear} style={styles.clearButton}>
          <MaterialCommunityIcons name="close" size={20} color="#666" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 48,
  },
  containerWithResults: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    padding: 0,
  },
  clearButton: {
    padding: 4,
  },
});
