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
  const [results, setResults] = useState<
    Array<{
      id: string;
      name: string;
      address: string;
      location: Location;
    }>
  >([]);
  const [showResults, setShowResults] = useState(false);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);

    if (query.length < 2) {
      setResults([]);
      setShowResults(false);
      return;
    }

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
      console.error("Search error:", error);
    }
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
    zIndex: 1,
  },
});
