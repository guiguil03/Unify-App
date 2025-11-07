import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigation } from "@react-navigation/native";
import MapView from "react-native-maps";
import { useLocation } from "../../../hooks/useLocation";
import { useContacts } from "../../../hooks/useContacts";
import { useRealtimeRunners } from "../../../hooks/useRealtimeRunners";
import { filterRunnersByDistance } from "../../../utils/runners";
import { createRegionFromLocation, createRegionFromRadius } from "../../../utils/map/region";
import { RunnersService } from "../../../services/RunnersService";
import { MAP_DEFAULTS } from "../../../constants/mapDefaults";
import { GOOGLE_MAPS_CONFIG } from "../../../services/map/config";
import { Location } from "../../../types/location";
import { Runner } from "../../../types/runner";
import { NavigationProp } from "../../../types/navigation";
import { ContactRelationshipStatus } from "../../../types/contact";
import { showErrorToast, showInfoToast, showSuccessToast } from "../../../utils/errorHandler";

export function useMapScreen() {
  const mapRef = useRef<MapView>(null);
  const navigation = useNavigation<NavigationProp>();
  const { location, loading, refreshLocation } = useLocation();
  const { contacts, relationships, addContact } = useContacts();

  const [state, setState] = useState({
    selectedLocation: null as Location | null,
    selectedAddress: "",
    searchRadius: MAP_DEFAULTS.SEARCH.DEFAULT_RADIUS,
    selectedRunner: null as Runner | null,
    showLocationSelector: false,
    activeSearchZone: false,
    filteredRunners: [] as Runner[],
    isRunnersListExpanded: false,
    showProfileModal: false,
    location,
    contacts,
    relationships: relationships as Record<string, ContactRelationshipStatus>,
    loadingRunners: false,
  });

  useEffect(() => {
    setState(prev => ({
      ...prev,
      contacts,
      relationships: relationships as Record<string, ContactRelationshipStatus>,
    }));
  }, [contacts, relationships]);

  const loadNearbyRunners = useCallback(async (center: Location, radius: number) => {
    try {
      setState(prev => ({ ...prev, loadingRunners: true }));
      const nearbyRunners = await RunnersService.getNearbyRunners(
        center,
        radius
      );
      
      // Filtrer par distance avec le rayon de recherche
      const filtered = filterRunnersByDistance(
        nearbyRunners,
        center,
        radius
      );

      setState(prev => ({
        ...prev,
        activeSearchZone: true,
        filteredRunners: filtered,
        loadingRunners: false,
      }));
    } catch (error) {
      console.error('Erreur lors du chargement des coureurs:', error);
      setState(prev => ({
        ...prev,
        filteredRunners: [],
        loadingRunners: false,
      }));
    }
  }, []);

  // Charger les coureurs au démarrage et mettre à jour la position de l'utilisateur
  useEffect(() => {
    if (location) {
      // Mettre à jour la position de l'utilisateur dans la base
      RunnersService.updateUserLocation({
        latitude: location.latitude,
        longitude: location.longitude,
      }).catch(err => {
        console.error('Erreur lors de la mise à jour de la position:', err);
      });
      
      // Charger les utilisateurs à proximité
      loadNearbyRunners(location, state.searchRadius);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);

  // Callback pour recharger les coureurs lors d'un changement en temps réel
  const handleRealtimeUpdate = useCallback(() => {
    const searchCenter = state.selectedLocation || location;
    if (searchCenter) {
      loadNearbyRunners(searchCenter, state.searchRadius);
    }
  }, [state.selectedLocation, location, state.searchRadius, loadNearbyRunners]);

  // S'abonner aux changements en temps réel
  const { isSubscribed } = useRealtimeRunners({
    location,
    searchRadius: state.searchRadius,
    selectedLocation: state.selectedLocation,
    onRunnersUpdate: handleRealtimeUpdate,
    enabled: true,
  });

  useEffect(() => {
    if (location && state.activeSearchZone) {
      const searchCenter = state.selectedLocation || location;
      loadNearbyRunners(searchCenter, state.searchRadius);
    }
  }, [state.searchRadius, state.activeSearchZone, location, state.selectedLocation, loadNearbyRunners]);

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

    handleValidateZone: async () => {
      const searchCenter = state.selectedLocation || state.location;
      if (searchCenter) {
        await loadNearbyRunners(searchCenter, state.searchRadius);
        setState(prev => ({ ...prev, showLocationSelector: false }));

        if (mapRef.current) {
          const region = createRegionFromRadius(searchCenter, state.searchRadius);
          mapRef.current.animateToRegion(region, GOOGLE_MAPS_CONFIG.ANIMATION_DURATION);
        }
      }
    },

    handleConnect: async (runnerId: string) => {
      const result = await addContact(runnerId);

      if (result.success) {
        showSuccessToast('Demande envoyée !');
        setState(prev => ({ ...prev, showProfileModal: false }));
        navigation.navigate('Contacts');
        return;
      }

      switch (result.reason) {
        case 'already_friends':
          showInfoToast('Vous êtes déjà amis.');
          setState(prev => ({ ...prev, showProfileModal: false }));
          break;
        case 'already_sent':
          showInfoToast('Vous avez déjà envoyé une demande à ce coureur.');
          break;
        case 'incoming_request':
          showInfoToast('Ce coureur vous a déjà envoyé une demande. Consultez vos demandes.');
          break;
        case 'blocked':
          showErrorToast('Vous ne pouvez pas envoyer de demande à ce coureur.');
          break;
        default:
          showErrorToast('Impossible d\'envoyer la demande. Réessayez plus tard.');
          break;
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
    state: {
      ...state,
      location,
      contacts,
    },
    handlers,
    refs: { mapRef },
    loading,
  };
}