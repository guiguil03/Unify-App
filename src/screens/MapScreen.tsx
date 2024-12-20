import React, { useState, useRef, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import MapView from "react-native-maps";
import { useNavigation } from "@react-navigation/native";
import { LocationService } from "../services/LocationService";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { RunnerMap } from "../components/map/RunnerMap";
import { SearchBar } from "../components/map/SearchBar";
import { LocationSelector } from "../components/map/LocationSelector";
import { SearchZone } from "../components/map/SearchZone";
import { MapControls } from "../components/map/MapControls";
import { RunnersList } from "../components/map/RunnersList";
import { RunnerProfileModal } from "../components/runners/RunnerProfileModal";
import { Runner } from "../types/runner";
import { Location } from "../types/location";
import { GOOGLE_MAPS_CONFIG } from "../services/map/config";
import { createRegionFromLocation, createRegionFromRadius } from "../utils/map/region";
import { MOCK_RUNNERS } from "../data/mockRunners";
import { useLocation } from "../hooks/useLocation";
import { useContacts } from "../hooks/useContacts";
import { filterRunnersByDistance } from "../utils/runners";
import { MAP_DEFAULTS } from "../constants/mapDefaults";
import { NavigationProp } from "../types/navigation";

export default function MapScreen() {
  const mapRef = useRef<MapView>(null);
  const navigation = useNavigation<NavigationProp>();
  const { location, loading, refreshLocation } = useLocation();
  const { contacts, addContact } = useContacts();
  
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [selectedAddress, setSelectedAddress] = useState<string>("");
  const [searchRadius, setSearchRadius] = useState(MAP_DEFAULTS.SEARCH.DEFAULT_RADIUS);
  const [selectedRunner, setSelectedRunner] = useState<Runner | null>(null);
  const [showLocationSelector, setShowLocationSelector] = useState(false);
  const [activeSearchZone, setActiveSearchZone] = useState(false);
  const [filteredRunners, setFilteredRunners] = useState(MOCK_RUNNERS);
  const [isRunnersListExpanded, setIsRunnersListExpanded] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  useEffect(() => {
    if (location) {
      setActiveSearchZone(true);
      const filtered = filterRunnersByDistance(
        MOCK_RUNNERS,
        location,
        searchRadius
      );
      setFilteredRunners(filtered);
    }
  }, [location]);

  const handleLocationSelect = (location: Location, address: string) => {
    setIsRunnersListExpanded(false);
    setSelectedLocation(location);
    setSelectedAddress(address);
    setShowLocationSelector(true);
    setActiveSearchZone(false);

    if (mapRef.current) {
      const region = createRegionFromLocation(location);
      mapRef.current.animateToRegion(region, GOOGLE_MAPS_CONFIG.ANIMATION_DURATION);
    }
  };

  const handleMapPress = () => {
    setIsRunnersListExpanded(false);
  };

  const handleMarkerPress = (runner: Runner) => {
    setSelectedRunner(runner);
    setIsRunnersListExpanded(true);
  };

  const handleRecenterPress = async () => {
    setIsRunnersListExpanded(false);
    const centerLocation = selectedLocation || location;
    if (centerLocation && mapRef.current) {
      const region = createRegionFromRadius(centerLocation, searchRadius);
      mapRef.current.animateToRegion(region, GOOGLE_MAPS_CONFIG.ANIMATION_DURATION);
    }
  };

  const handleSettingsPress = () => {
    setIsRunnersListExpanded(false);
    setShowLocationSelector(true);
    if (!selectedLocation && location) {
      setSelectedLocation(location);
      setSelectedAddress("Ma position actuelle");
    }
  };

  const handleValidateZone = () => {
    if (selectedLocation || location) {
      const searchCenter = selectedLocation || location;
      setActiveSearchZone(true);
      setShowLocationSelector(false);

      const filtered = filterRunnersByDistance(
        MOCK_RUNNERS,
        searchCenter,
        searchRadius
      );
      setFilteredRunners(filtered);

      if (mapRef.current) {
        const region = createRegionFromRadius(searchCenter, searchRadius);
        mapRef.current.animateToRegion(region, GOOGLE_MAPS_CONFIG.ANIMATION_DURATION);
      }
    }
  };

  const handleRunnerPress = (runner: Runner) => {
    setSelectedRunner(runner);
    setShowProfileModal(true);
    setIsRunnersListExpanded(false);
  };

  const handleConnect = async (runnerId: string) => {
    const success = await addContact(runnerId);
    if (success) {
      setShowProfileModal(false);
      navigation.navigate('Contacts');
    }
  };

  if (loading || !location) {
    return <LoadingSpinner message="Chargement de la carte..." />;
  }

  return (
    <View style={styles.container}>
      <SearchBar
        onLocationSelect={handleLocationSelect}
        onFocus={() => setIsRunnersListExpanded(false)}
      />

      <RunnerMap
        ref={mapRef}
        userLocation={location}
        runners={filteredRunners}
        initialRegion={createRegionFromLocation(location)}
        selectedRunner={selectedRunner}
        onRunnerPress={handleRunnerPress}
        onMarkerPress={handleMarkerPress}
        onMapPress={handleMapPress}
      >
        {(selectedLocation || location) && (
          <SearchZone
            center={selectedLocation || location}
            radius={searchRadius}
            visible={activeSearchZone}
          />
        )}
      </RunnerMap>

      <MapControls
        onRecenterPress={handleRecenterPress}
        onSettingsPress={handleSettingsPress}
      />

      {showLocationSelector && (selectedLocation || location) && (
        <LocationSelector
          address={selectedAddress || "Ma position actuelle"}
          radius={searchRadius}
          onRadiusChange={setSearchRadius}
          onValidate={handleValidateZone}
          style={styles.locationSelector}
        />
      )}

      <RunnersList
        runners={filteredRunners}
        onRunnerPress={handleRunnerPress}
        selectedRunner={selectedRunner}
        isExpanded={isRunnersListExpanded}
        onCollapse={() => setIsRunnersListExpanded(false)}
      />

      <RunnerProfileModal
        visible={showProfileModal}
        runner={selectedRunner}
        onClose={() => setShowProfileModal(false)}
        onConnect={handleConnect}
        isConnected={contacts.some(c => c.id === selectedRunner?.id)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  locationSelector: {
    position: "absolute",
    bottom: 120,
    left: 16,
    right: 16,
  },
});