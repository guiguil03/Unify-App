import React from "react";
import { RunnerMap } from "../../../components/map/RunnerMap";
import { SearchZone } from "../../../components/map/SearchZone";
import { createRegionFromLocation } from "../../../utils/map/region";

export function MapContent({ mapRef, state, handlers }) {
  return (
    <RunnerMap
      ref={mapRef}
      userLocation={state.location}
      runners={state.filteredRunners}
      initialRegion={createRegionFromLocation(state.location)}
      selectedRunner={state.selectedRunner}
      onRunnerPress={handlers.handleRunnerPress}
      onMarkerPress={handlers.handleMarkerPress}
      onMapPress={handlers.handleMapPress}
    >
      {(state.selectedLocation || state.location) && (
        <SearchZone
          center={state.selectedLocation || state.location}
          radius={state.searchRadius}
          visible={state.activeSearchZone}
        />
      )}
    </RunnerMap>
  );
}