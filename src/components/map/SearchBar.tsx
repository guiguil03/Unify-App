import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import { SearchInput } from "./SearchInput";
import { SearchResults } from "./SearchResults";
import { GeocodingService } from "../../services/map/GeocodingService";
import { Location } from "../../types/location";

interface SearchBarProps {
  onLocationSelect: (location: Location, address: string) => void;
  onFocus?: () => void;
}

export function SearchBar({ onLocationSelect, onFocus }: SearchBarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  const [results, setResults] = useState<
    Array<{
      id: string;
      name: string;
      address: string;
      location: Location;
    }>
  >([]);
  const [showResults, setShowResults] = useState(false);

  const handleSearch = (query: string) => {
    setSearchQuery(query);

    if (searchTimeout) clearTimeout(searchTimeout);

    if (query.length < 3) {
      setResults([]);
      setShowResults(false);
      return;
    }

    const timeout = setTimeout(async () => {
      try {
        const searchResults = await GeocodingService.searchLocation(query);
        if (searchResults) {
          setResults([
            {
              id: "1",
              name: searchResults.name,
              address: searchResults.formattedAddress,
              location: searchResults.location,
            },
          ]);
          setShowResults(true);
        }
      } catch (error) {
        if (__DEV__) console.error('Map search failed:', error);
      }
    }, 500); // Attendre 500ms avant de lancer la recherche

    setSearchTimeout(timeout);
  };

  const handleSelectResult = (result: {
    location: Location;
    address: string;
  }) => {
    onLocationSelect(result.location, result.address);
    setResults([]);
    setShowResults(false);
    setSearchQuery(result.address);
  };

  return (
    <View style={styles.container}>
      <SearchInput
        value={searchQuery}
        onChangeText={handleSearch}
        onClear={() => {
          setSearchQuery("");
          setResults([]);
          setShowResults(false);
        }}
        onFocus={onFocus}
        onSubmit={() => {}}
        placeholder="Rechercher un lieu..."
        showResults={showResults && results.length > 0}
      />
      <SearchResults
        results={results}
        onSelectResult={handleSelectResult}
        visible={showResults}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 20,
    left: 16,
    right: 16,
    zIndex: 20,
  },
});
