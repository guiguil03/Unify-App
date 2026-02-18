import React, { useState, useRef, useEffect, useCallback } from "react";
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
import { ClusterCarousel } from "../components/map/ClusterCarousel";
import { RunnerProfileModal } from "../components/runners/RunnerProfileModal";
import { Runner } from "../types/runner";
import { Location } from "../types/location";
import { GOOGLE_MAPS_CONFIG } from "../services/map/config";
import { createRegionFromLocation, createRegionFromRadius } from "../utils/map/region";
import { MOCK_RUNNERS } from "../data/mockRunners";
import { RunnersService } from "../services/RunnersService";
import { useLocation } from "../hooks/useLocation";
import { useContacts } from "../hooks/useContacts";
import { showErrorToast, showInfoToast, showSuccessToast } from "../utils/errorHandler";
import { filterRunnersByDistance } from "../utils/runners";
import { MAP_DEFAULTS } from "../constants/mapDefaults";
import { NavigationProp } from "../types/navigation";

export default function MapScreen() {
  const mapRef = useRef<MapView>(null);
  const navigation = useNavigation<NavigationProp>();
  const { location, loading, refreshLocation } = useLocation();
  const { contacts, relationships, addContact } = useContacts();
  
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [selectedAddress, setSelectedAddress] = useState<string>("");
  const [searchRadius, setSearchRadius] = useState(MAP_DEFAULTS.SEARCH.DEFAULT_RADIUS);
  const [selectedRunner, setSelectedRunner] = useState<Runner | null>(null);
  const [showLocationSelector, setShowLocationSelector] = useState(false);
  const [activeSearchZone, setActiveSearchZone] = useState(false);
  // Tous les runners pour la carte (affichés par défaut)
  const [allRunners, setAllRunners] = useState<Runner[]>([]);
  // Runners filtrés pour la liste (dans la zone de recherche)
  const [filteredRunners, setFilteredRunners] = useState<Runner[]>([]);
  const [isRunnersListExpanded, setIsRunnersListExpanded] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showClusterCarousel, setShowClusterCarousel] = useState(false);
  const [clusterRunners, setClusterRunners] = useState<Runner[]>([]);
  const [loadingRunners, setLoadingRunners] = useState(false);

  // Charger tous les runners au démarrage
  useEffect(() => {
    const loadAllRunners = async () => {
      try {
        setLoadingRunners(true);
        const runners = await RunnersService.getAllRunners();
        setAllRunners(runners);
        // Initialiser filteredRunners avec tous les runners aussi
        if (location) {
          const filtered = filterRunnersByDistance(
            runners,
            location,
            searchRadius
          );
          setFilteredRunners(filtered);
        } else {
          setFilteredRunners(runners);
        }
      } catch (error) {
        setAllRunners([]);
      } finally {
        setLoadingRunners(false);
      }
    };

    loadAllRunners();
  }, []); // Charger une seule fois au démarrage

  useEffect(() => {
    if (location && allRunners.length > 0) {
      setActiveSearchZone(true);
      const filtered = filterRunnersByDistance(
        allRunners,
        location,
        searchRadius
      );
      setFilteredRunners(filtered);
    }
  }, [location, searchRadius, allRunners]);

  const handleLocationSelect = (location: Location, address: string) => {
    setIsRunnersListExpanded(false);
    setSelectedLocation(location);
    setSelectedAddress(address);
    setShowLocationSelector(true); // Ouvrir le sélecteur pour configurer la zone
    setActiveSearchZone(false); // Ne pas activer la zone tout de suite
    setShowClusterCarousel(false); // Fermer le carousel

    // Recentrer la carte sur le lieu sélectionné (sans zoom sur la zone)
    if (mapRef.current) {
      const region = createRegionFromLocation(location);
      mapRef.current.animateToRegion(region, GOOGLE_MAPS_CONFIG.ANIMATION_DURATION);
    }
  };

  const handleMapPress = () => {
    setIsRunnersListExpanded(false);
    setShowClusterCarousel(false);
  };

  const handleMarkerPress = (runner: Runner) => {
    setSelectedRunner(runner);
    // Ouvrir le slider avec cet utilisateur
    setClusterRunners([runner]);
    setShowClusterCarousel(true);
    setIsRunnersListExpanded(false);
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

      // Filtrer les runners dans cette zone
      const filtered = filterRunnersByDistance(
        allRunners,
        searchCenter,
        searchRadius
      );
      setFilteredRunners(filtered);

      // Si il y a des runners dans cette zone, les afficher dans le ClusterCarousel
      if (filtered.length > 0) {
        setClusterRunners(filtered);
        setShowClusterCarousel(true);
      } else {
        setShowClusterCarousel(false);
      }

      // Recentrer la carte sur la zone avec le bon zoom
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
    setShowClusterCarousel(false);
  };

  const handleClusterPress = useCallback((runners: Runner[]) => {
    if (runners && runners.length > 0) {
      setClusterRunners(runners);
      setShowClusterCarousel(true);
      setIsRunnersListExpanded(false);
      setSelectedRunner(null);
    }
  }, []);

  const handleResetToMyLocation = () => {
    // Réinitialiser tout
    setSelectedLocation(null);
    setSelectedAddress("");
    setActiveSearchZone(false);
    setShowLocationSelector(false);
    setShowClusterCarousel(false);
    setClusterRunners([]);
    setSelectedRunner(null);
    setIsRunnersListExpanded(false);
    
    // Réinitialiser les runners filtrés avec tous les runners
    setFilteredRunners(allRunners);
    
    // Recentrer sur la position actuelle
    if (location && mapRef.current) {
      const region = createRegionFromLocation(location);
      mapRef.current.animateToRegion(region, GOOGLE_MAPS_CONFIG.ANIMATION_DURATION);
    }
  };

  const handleMessage = (runnerId: string, runnerName: string, avatar?: string) => {
    setShowProfileModal(false);
    setShowClusterCarousel(false);
    navigation.navigate('Chat', { contactId: runnerId, contactName: runnerName, contactAvatar: avatar });
  };

  const handleConnect = async (runnerId: string) => {
    const result = await addContact(runnerId);

    if (result.success) {
      if (result.autoAccepted) {
        showSuccessToast('Vous êtes maintenant amis ! 🎉');
      } else {
        showSuccessToast('Demande envoyée !');
      }
      setShowProfileModal(false);
      navigation.navigate('Contacts');
      return;
    }

    switch (result.reason) {
      case 'already_friends':
        showInfoToast('Vous êtes déjà amis.');
        setShowProfileModal(false);
        break;
      case 'already_sent':
        showInfoToast('Vous avez déjà envoyé une demande à ce coureur.');
        break;
      case 'blocked':
        showErrorToast('Vous ne pouvez pas envoyer de demande à ce coureur.');
        break;
      default:
        showErrorToast('Impossible d\'envoyer la demande.');
        break;
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
        runners={activeSearchZone ? filteredRunners : allRunners}
        initialRegion={createRegionFromLocation(location)}
        selectedRunner={selectedRunner}
        onRunnerPress={handleRunnerPress}
        onMarkerPress={handleMarkerPress}
        onClusterPress={handleClusterPress}
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
        onResetPress={handleResetToMyLocation}
        hasCustomLocation={!!selectedLocation}
      />

      {showLocationSelector && (selectedLocation || location) && (
        <LocationSelector
          address={selectedAddress || "Ma position actuelle"}
          radius={searchRadius}
          onRadiusChange={setSearchRadius}
          onValidate={handleValidateZone}
          onClose={handleResetToMyLocation}
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

      <ClusterCarousel
        visible={showClusterCarousel}
        runners={clusterRunners}
        relationships={relationships}
        onClose={() => {
          setShowClusterCarousel(false);
          setClusterRunners([]);
        }}
        onRunnerPress={handleRunnerPress}
        onConnect={handleConnect}
        onMessage={handleMessage}
      />

      <RunnerProfileModal
        visible={showProfileModal}
        runner={selectedRunner}
        onClose={() => {
          setShowProfileModal(false);
          // Réinitialiser le runner sélectionné après la fermeture complète du modal
          // Utiliser un délai plus long pour s'assurer que l'animation de fermeture est terminée
          setTimeout(() => {
            setSelectedRunner(null);
          }, 500);
        }}
        onConnect={handleConnect}
        onMessage={handleMessage}
        relationshipStatus={selectedRunner ? relationships[selectedRunner.id] ?? 'none' : 'none'}
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