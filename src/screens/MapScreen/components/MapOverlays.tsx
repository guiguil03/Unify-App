import React from "react";
import { StyleSheet } from "react-native";
import { SearchBar } from "../../../components/map/SearchBar";
import { LocationSelector } from "../../../components/map/LocationSelector";
import { MapControls } from "../../../components/map/MapControls";
import { MapFilters } from "../../../components/map/MapFilters";
import { RunnersList } from "../../../components/map/RunnersList";
import { RunnerProfileModal } from "../../../components/runners/RunnerProfileModal";
import { ClusterCarousel } from "../../../components/map/ClusterCarousel";
import { PremiumModal } from "../../../components/common/PremiumModal";
import { useNavigation } from "@react-navigation/native";
import { NavigationProp } from "../../../types/navigation";

export function MapOverlays({ state, handlers }: { state: any; handlers: any }) {
  const navigation = useNavigation<NavigationProp>();

  return (
    <>
      <SearchBar
        onLocationSelect={handlers.handleLocationSelect}
        onFocus={() => handlers.setIsRunnersListExpanded(false)}
      />

      <MapControls
        onRecenterPress={handlers.handleRecenterPress}
        onSettingsPress={handlers.handleSettingsPress}
        onResetPress={handlers.handleResetToMyLocation}
        hasCustomLocation={!!state.selectedLocation}
      />

      {state.showLocationSelector && (state.selectedLocation || state.location) && (
        <LocationSelector
          address={state.selectedAddress || "Ma position actuelle"}
          radius={state.searchRadius}
          onRadiusChange={handlers.handleRadiusChange}
          onValidate={handlers.handleValidateZone}
          onClose={handlers.handleCloseLocationSelector}
          style={styles.locationSelector}
        />
      )}

      {/* Afficher les filtres seulement après validation de la zone */}
      {state.activeSearchZone && !state.showLocationSelector && (
        <MapFilters
          settings={state.settings}
          onSettingChange={handlers.handleFilterChange}
          style={styles.mapFilters}
        />
      )}

      <RunnersList
        runners={state.filteredRunners}
        onRunnerPress={handlers.handleRunnerPress}
        selectedRunner={state.selectedRunner}
        isExpanded={state.isRunnersListExpanded}
        onCollapse={() => handlers.setIsRunnersListExpanded(false)}
        isModalVisible={state.showProfileModal}
      />

      <RunnerProfileModal
        visible={state.showProfileModal}
        runner={state.selectedRunner}
        onClose={() => handlers.setShowProfileModal(false)}
        onMessage={(runnerId, runnerName, avatar) => handlers.handleMessage(runnerId, runnerName, avatar)}
        onConnect={(runnerId) => handlers.handleConnect(runnerId)}
        relationshipStatus={state.selectedRunner ? state.relationships?.[state.selectedRunner.id] ?? 'none' : 'none'}
      />

      <ClusterCarousel
        visible={state.showClusterCarousel}
        runners={state.selectedCluster ?? []}
        relationships={state.relationships ?? {}}
        onClose={handlers.handleCloseCluster}
        onRunnerPress={handlers.handleRunnerPress}
        onConnect={(runnerId) => handlers.handleConnect(runnerId)}
        onMessage={(runnerId, runnerName, avatar) => handlers.handleMessage(runnerId, runnerName, avatar)}
      />

      <PremiumModal
        visible={state.showPremiumModal}
        feature="Les rencontres illimitées"
        onClose={() => handlers.setShowPremiumModal(false)}
        onUpgrade={() => {
          handlers.setShowPremiumModal(false);
          navigation.navigate('Settings');
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  locationSelector: {
    position: "absolute",
    bottom: 120,
    left: 16,
    right: 16,
  },
  mapFilters: {
    // Le style est géré dans le composant MapFilters lui-même
  },
});