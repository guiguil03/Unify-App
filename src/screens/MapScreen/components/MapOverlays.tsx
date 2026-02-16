import React from "react";
import { StyleSheet } from "react-native";
import { SearchBar } from "../../../components/map/SearchBar";
import { LocationSelector } from "../../../components/map/LocationSelector";
import { MapControls } from "../../../components/map/MapControls";
import { MapFilters } from "../../../components/map/MapFilters";
import { RunnersList } from "../../../components/map/RunnersList";
import { RunnerProfileModal } from "../../../components/runners/RunnerProfileModal";

export function MapOverlays({ state, handlers }) {
  return (
    <>
      <SearchBar
        onLocationSelect={handlers.handleLocationSelect}
        onFocus={() => handlers.setIsRunnersListExpanded(false)}
      />

      <MapControls
        onRecenterPress={handlers.handleRecenterPress}
        onSettingsPress={handlers.handleSettingsPress}
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
      />

      <RunnerProfileModal
        visible={state.showProfileModal}
        runner={state.selectedRunner}
        onClose={() => handlers.setShowProfileModal(false)}
        onConnect={handlers.handleConnect}
        relationshipStatus={state.selectedRunner ? state.relationships?.[state.selectedRunner.id] ?? 'none' : 'none'}
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