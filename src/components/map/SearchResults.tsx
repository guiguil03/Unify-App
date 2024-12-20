import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

interface SearchResult {
  id: string;
  name: string;
  address: string;
}

interface SearchResultsProps {
  results: SearchResult[];
  onSelectResult: (result: SearchResult) => void;
  visible: boolean;
}

export function SearchResults({
  results,
  onSelectResult,
  visible,
}: SearchResultsProps) {
  const heightAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(heightAnim, {
      toValue: visible && results.length > 0 ? 250 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [visible, results]);

  if (!visible || results.length === 0) return null;

  return (
    <Animated.View style={[styles.wrapper, { maxHeight: heightAnim }]}>
      <View style={styles.divider} />
      <ScrollView
        style={styles.container}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.contentContainer}
      >
        {results.map((result) => (
          <TouchableOpacity
            key={result.id}
            style={styles.resultItem}
            onPress={() => onSelectResult(result)}
          >
            <MaterialCommunityIcons
              name="map-marker"
              size={20}
              color="#E83D4D"
            />
            <View style={styles.resultText}>
              <Text style={styles.resultName}>{result.name}</Text>
              <Text style={styles.resultAddress}>{result.address}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    overflow: "hidden",
    backgroundColor: "white",
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  container: {
    flexGrow: 0,
    backgroundColor: "white",
  },
  contentContainer: {
    flexGrow: 0,
  },
  divider: {
    height: 1,
    backgroundColor: "#e0e0e0",
    marginHorizontal: 12,
  },
  resultItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "white",
  },
  resultText: {
    marginLeft: 12,
    flex: 1,
  },
  resultName: {
    fontSize: 16,
    color: "#333",
    marginBottom: 2,
  },
  resultAddress: {
    fontSize: 14,
    color: "#666",
  },
});
