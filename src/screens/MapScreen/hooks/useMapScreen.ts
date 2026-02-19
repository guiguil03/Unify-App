import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import MapView from "react-native-maps";
import { useLocation } from "../../../hooks/useLocation";
import { useContacts } from "../../../hooks/useContacts";
import { useSettings } from "../../../hooks/useSettings";
import { useProfile } from "../../../hooks/useProfile";
import { useRealtimeRunners } from "../../../hooks/useRealtimeRunners";
import { filterRunnersByDistance, filterRunnersByPreferences } from "../../../utils/runners";
import { createRegionFromLocation, createRegionFromRadius } from "../../../utils/map/region";
import { RunnersService } from "../../../services/RunnersService";
import { MAP_DEFAULTS } from "../../../constants/mapDefaults";
import { GOOGLE_MAPS_CONFIG } from "../../../services/map/config";
import { Location } from "../../../types/location";
import { Runner } from "../../../types/runner";
import { NavigationProp } from "../../../types/navigation";
import { ContactRelationshipStatus } from "../../../types/contact";
import { Settings } from "../../../types/settings";
import { showErrorToast, showInfoToast, showSuccessToast } from "../../../utils/errorHandler";

export function useMapScreen() {
  const mapRef = useRef<MapView>(null);
  // Guard: first load complete → enables realtime + radius/location effects
  const isInitialLoadComplete = useRef(false);
  // Guard: first focus = no runner reload (useEffect[location] handles it)
  const hasFocusedOnce = useRef(false);
  // Cooldown: ignore realtime events fired within 15s of a successful load
  // (prevents our own updateUserLocation write from triggering a filter-apply reload)
  const lastLoadTimeRef = useRef(0);

  const navigation = useNavigation<NavigationProp>();
  const { location, loading, refreshLocation } = useLocation();
  const { contacts, relationships, addContact } = useContacts();
  const { settings, reloadSettings, updateSetting } = useSettings();
  const { profile, refetch: refetchProfile } = useProfile();

  // Stable refs so loadNearbyRunners can have [] deps and never be recreated
  const settingsRef = useRef(settings);
  const profileRef = useRef(profile);
  const searchCenterRef = useRef<{ center: Location; radius: number } | null>(null);
  useEffect(() => { settingsRef.current = settings; }, [settings]);
  useEffect(() => { profileRef.current = profile; }, [profile]);

  const [state, setState] = useState({
    selectedLocation: null as Location | null,
    selectedAddress: "",
    searchRadius: MAP_DEFAULTS.SEARCH.DEFAULT_RADIUS as number,
    selectedRunner: null as Runner | null,
    showLocationSelector: false,
    activeSearchZone: false,
    filteredRunners: [] as Runner[],
    isRunnersListExpanded: false,
    showProfileModal: false,
    showPremiumModal: false,
    // Cluster carousel
    selectedCluster: null as Runner[] | null,
    showClusterCarousel: false,
    loadingRunners: false,
  });

  // Stable callback — reads settings/profile from refs, never recreated on settings/profile change
  const loadNearbyRunners = useCallback(async (center: Location, radius: number) => {
    searchCenterRef.current = { center, radius };
    try {
      setState(prev => ({ ...prev, loadingRunners: true }));
      const nearbyRunners = await RunnersService.getNearbyRunners(center, radius);

      let filtered = filterRunnersByDistance(nearbyRunners, center, radius);
      filtered = filterRunnersByPreferences(
        filtered,
        settingsRef.current,
        profileRef.current?.gender,
        profileRef.current?.stats?.averagePace,
        profileRef.current?.preferredTime
      );

      isInitialLoadComplete.current = true;
      lastLoadTimeRef.current = Date.now();
      setState(prev => ({
        ...prev,
        activeSearchZone: true,
        filteredRunners: filtered,
        loadingRunners: false,
      }));
    } catch (error) {
      if (__DEV__) console.error('Nearby runners load failed:', error);
      // Keep existing runners on error — do NOT clear filteredRunners
      setState(prev => ({ ...prev, loadingRunners: false }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Stable — reads settings/profile from refs

  // Charger les coureurs au démarrage et mettre à jour la position de l'utilisateur
  useEffect(() => {
    if (location) {
      // Mettre à jour la position de l'utilisateur dans la base
      RunnersService.updateUserLocation({
        latitude: location.latitude,
        longitude: location.longitude,
      }).catch((error: unknown) => {
        if (__DEV__) console.error('Location update failed:', error);
      });

      // Charger les utilisateurs à proximité
      loadNearbyRunners(location, state.searchRadius);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);

  // Callback pour recharger les coureurs lors d'un changement en temps réel.
  // Cooldown de 15s : évite que notre propre updateUserLocation déclenche un rechargement
  // filtré (le changement Supabase remonte via postgres_changes ~3s après l'écriture).
  const handleRealtimeUpdate = useCallback(() => {
    if (!isInitialLoadComplete.current) return;
    if (Date.now() - lastLoadTimeRef.current < 15000) return;
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

  // Recharger quand le rayon ou la zone de recherche change (après le premier chargement)
  useEffect(() => {
    if (!isInitialLoadComplete.current) return;
    const searchCenter = state.selectedLocation || location;
    if (!searchCenter) return;
    loadNearbyRunners(searchCenter, state.searchRadius);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.searchRadius, state.selectedLocation, loadNearbyRunners]);

  // Recharger les settings et le profil quand on revient sur la carte.
  // Premier focus : useEffect[location] gère déjà le chargement — pas de double appel.
  // Focusses suivants : recharger après refresh settings/profile.
  useFocusEffect(
    useCallback(() => {
      const isFirstFocus = !hasFocusedOnce.current;
      hasFocusedOnce.current = true;
      const refreshData = async () => {
        // Lancer en parallèle pour diviser le temps d'attente par 2
        await Promise.all([reloadSettings(), refetchProfile()]);
        // Recharger les runners si ce n'est pas le premier focus, que le chargement initial est terminé,
        // qu'on a une zone de recherche sauvegardée et une location
        if (!isFirstFocus && isInitialLoadComplete.current && searchCenterRef.current && location) {
          loadNearbyRunners(searchCenterRef.current.center, searchCenterRef.current.radius);
        }
      };
      refreshData();
    }, [reloadSettings, refetchProfile, loadNearbyRunners, location])
  );

  const handlers = {
    handleLocationSelect: (location: Location, address: string) => {
      setState(prev => ({
        ...prev,
        selectedLocation: location,
        selectedAddress: address,
        showLocationSelector: true,
        activeSearchZone: true,
        isRunnersListExpanded: false,
      }));

      if (mapRef.current) {
        const region = createRegionFromRadius(location, state.searchRadius);
        mapRef.current.animateToRegion(region, GOOGLE_MAPS_CONFIG.ANIMATION_DURATION);
      }
    },

    handleClusterPress: (runners: Runner[]) => {
      setState(prev => ({
        ...prev,
        selectedCluster: runners,
        showClusterCarousel: true,
        isRunnersListExpanded: false,
        showProfileModal: false,
      }));
    },

    handleCloseCluster: () => {
      setState(prev => ({
        ...prev,
        showClusterCarousel: false,
        selectedCluster: null,
      }));
    },

    handleRunnerPress: (runner: Runner) => {
      setState(prev => ({
        ...prev,
        selectedRunner: runner,
        showProfileModal: true,
        isRunnersListExpanded: false,
        showClusterCarousel: false,
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
        showLocationSelector: false,
      }));
    },

    handleRecenterPress: async () => {
      const centerLocation = state.selectedLocation || location;
      if (centerLocation && mapRef.current) {
        const region = createRegionFromRadius(centerLocation, state.searchRadius);
        mapRef.current.animateToRegion(region, GOOGLE_MAPS_CONFIG.ANIMATION_DURATION);
      }
    },

    handleResetToMyLocation: () => {
      if (!location) return;
      // Réinitialisation complète : on efface tout et on recharge à la position GPS
      setState(prev => ({
        ...prev,
        selectedLocation: null,
        selectedAddress: '',
        showLocationSelector: false,
        activeSearchZone: false,
        filteredRunners: [],
        isRunnersListExpanded: false,
        showProfileModal: false,
        showPremiumModal: false,
        showClusterCarousel: false,
        selectedCluster: null,
        selectedRunner: null,
      }));
      // Recentrer la carte sur la position GPS
      if (mapRef.current) {
        const region = createRegionFromRadius(location, state.searchRadius);
        mapRef.current.animateToRegion(region, GOOGLE_MAPS_CONFIG.ANIMATION_DURATION);
      }
      // Recharger les coureurs à la position GPS
      loadNearbyRunners(location, state.searchRadius);
    },

    handleSettingsPress: () => {
      setState(prev => ({
        ...prev,
        showLocationSelector: true,
        isRunnersListExpanded: false,
        selectedLocation: prev.selectedLocation || location,
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
      const searchCenter = state.selectedLocation || location;
      if (searchCenter) {
        // Fermer le LocationSelector immédiatement
        setState(prev => ({
          ...prev,
          showLocationSelector: false,
          activeSearchZone: true,
        }));

        // Charger les coureurs avec les filtres
        await loadNearbyRunners(searchCenter, state.searchRadius);

        if (mapRef.current) {
          const region = createRegionFromRadius(searchCenter, state.searchRadius);
          mapRef.current.animateToRegion(region, GOOGLE_MAPS_CONFIG.ANIMATION_DURATION);
        }
      }
    },

    handleCloseLocationSelector: () => {
      setState(prev => ({
        ...prev,
        showLocationSelector: false,
        activeSearchZone: false,
      }));
    },

    handleConnect: async (runnerId: string, isPremium = false) => {
      const result = await addContact(runnerId, isPremium);

      if (result.success) {
        showSuccessToast('Demande envoyée !');
        setState(prev => ({ ...prev, showProfileModal: false }));
        navigation.navigate('Contacts');
        return;
      }

      switch (result.reason) {
        case 'monthly_limit_reached':
          setState(prev => ({ ...prev, showProfileModal: false, showPremiumModal: true }));
          break;
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

    handleMessage: (runnerId: string, runnerName: string, avatar?: string) => {
      setState(prev => ({ ...prev, showProfileModal: false }));
      navigation.navigate('Chat', { contactId: runnerId, contactName: runnerName, contactAvatar: avatar });
    },

    setIsRunnersListExpanded: (expanded: boolean) => {
      setState(prev => ({ ...prev, isRunnersListExpanded: expanded }));
    },

    setShowProfileModal: (visible: boolean) => {
      setState(prev => ({ ...prev, showProfileModal: visible }));
    },

    setShowPremiumModal: (visible: boolean) => {
      setState(prev => ({ ...prev, showPremiumModal: visible }));
    },

    handleFilterChange: async (key: keyof Settings, value: boolean) => {
      await updateSetting(key, value);

      const searchCenter = state.selectedLocation || location;
      if (searchCenter && state.activeSearchZone) {
        const updatedSettings = { ...settingsRef.current, [key]: value };
        try {
          setState(prev => ({ ...prev, loadingRunners: true }));
          const nearbyRunners = await RunnersService.getNearbyRunners(
            searchCenter,
            state.searchRadius
          );

          let filtered = filterRunnersByDistance(nearbyRunners, searchCenter, state.searchRadius);
          filtered = filterRunnersByPreferences(
            filtered,
            updatedSettings,
            profileRef.current?.gender,
            profileRef.current?.stats?.averagePace,
            profileRef.current?.preferredTime
          );

          setState(prev => ({
            ...prev,
            filteredRunners: filtered,
            loadingRunners: false,
          }));
        } catch (error) {
          if (__DEV__) console.error('Filter change runners reload failed:', error);
          setState(prev => ({ ...prev, loadingRunners: false }));
        }
      }
    },
  };

  return {
    state: {
      ...state,
      location,
      contacts,
      relationships: relationships as Record<string, ContactRelationshipStatus>,
      settings,
    },
    handlers,
    refs: { mapRef },
    loading,
  };
}
