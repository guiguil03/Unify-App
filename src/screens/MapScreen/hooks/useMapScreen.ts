import { useState, useRef, useEffect } from "react";
import { useNavigation } from "@react-navigation/native";
import MapView from "react-native-maps";
import { useLocation } from "../../../hooks/useLocation";
import { useContacts } from "../../../hooks/useContacts";
import { filterRunnersByDistance } from "../../../utils/runners";
import { createRegionFromLocation, createRegionFromRadius } from "../../../utils/map/region";
import { MOCK_RUNNERS } from "../../../data/mockRunners";
import { MAP_DEFAULTS } from "../../../constants/mapDefaults";
import { GOOGLE_MAPS_CONFIG } from "../../../services/map/config";
import { Location } from "../../../types/location";
import { Runner } from "../../../types/runner";
import { NavigationProp } from "../../../types/navigation";

export function useMapScreen() {
  const mapRef = useRef<MapView>(null);
  const navigation = useNavigation<NavigationProp>();
  const { location, loading, refreshLocation } = useLocation();
  const { contacts, addContact } = useContacts();

  const [state, setState] = useState({
    selectedLocation: null as Location | null,
    selectedAddress: "",
    searchRadius: MAP_DEFAULTS.SEARCH.DEFAULT_RADIUS,
    selectedRunner: null as Runner | null,
    showLocationSelector: false,
    activeSearchZone: false,
    filteredRunners: MOCK_RUNNERS,
    isRunnersListExpanded: false,
    showProfileModal: false,
    location,
    contacts,
  });

  useEffect(() => {
    if (location) {
      updateFilteredRunners(location);
    }
  }, [location]);

  const updateFilteredRunners = (center: Location) => {
    setState(prev => ({
      ...prev,
      activeSearchZone: true,
      filteredRunners: filterRunnersByDistance(
        MOCK_RUNNERS,
        center,
        prev.searchRadius
      ),
    }));
  };

  const handlers = {
    handleLocationSelect: (location: Location, address: string) => {
      setState(prev => ({
        ...prev,
        selectedLocation: location,
        selectedAddress: address,
        showLocationSelector: true,
        activeSearchZone: false,
        isRunnersListExpanded: false,
      }));

      if (mapRef.current) {
        const region = createRegionFromLocation(location);
        mapRef.current.animateToRegion(region, GOOGLE_MAPS_CONFIG.ANIMATION_DURATION);
      }
    },

    handleRunnerPress: (runner: Runner) => {
      setState(prev => ({
        ...prev,
        selectedRunner: runner,
        showProfileModal: true,
        isRunnersListExpanded: false,
      }));
    },

    handleMarkerPress: (runner: Runner) => {
      setState(prev => ({
        ...prev,
        selectedRunner: runner,
        isRunnersListExpanded: true,
      }));
    },

    handleMapPress: () => {
      setState(prev => ({
        ...prev,
        isRunnersListExpanded: false,
      }));
    },

    handleRecenterPress: async () => {
      const centerLocation = state.selectedLocation || state.location;
      if (centerLocation && mapRef.current) {
        const region = createRegionFromRadius(centerLocation, state.searchRadius);
        mapRef.current.animateToRegion(region, GOOGLE_MAPS_CONFIG.ANIMATION_DURATION);
      }
    },

    handleSettingsPress: () => {
      setState(prev => ({
        ...prev,
        showLocationSelector: true,
        isRunnersListExpanded: false,
        selectedLocation: prev.selectedLocation || prev.location,
        selectedAddress: prev.selectedAddress || "Ma position actuelle",
      }));
    },

    handleRadiusChange: (radius: number) => {
      setState(prev => ({
        ...prev,
        searchRadius: radius,
      }));
    },

    handleValidateZone: () => {
      const searchCenter = state.selectedLocation || state.location;
      if (searchCenter) {
        setState(prev => ({
          ...prev,
          activeSearchZone: true,
          showLocationSelector: false,
          filteredRunners: filterRunnersByDistance(
            MOCK_RUNNERS,
            searchCenter,
            prev.searchRadius
          ),
        }));

        if (mapRef.current) {
          const region = createRegionFromRadius(searchCenter, state.searchRadius);
          mapRef.current.animateToRegion(region, GOOGLE_MAPS_CONFIG.ANIMATION_DURATION);
        }
      }
    },

    handleConnect: async (runnerId: string) => {
      const success = await addContact(runnerId);
      if (success) {
        setState(prev => ({ ...prev, showProfileModal: false }));
        navigation.navigate('Contacts');
      }
    },

    setIsRunnersListExpanded: (expanded: boolean) => {
      setState(prev => ({ ...prev, isRunnersListExpanded: expanded }));
    },

    setShowProfileModal: (visible: boolean) => {
      setState(prev => ({ ...prev, showProfileModal: visible }));
    },
  };

  return {
    state,
    handlers,
    refs: { mapRef },
    loading,
  };
}