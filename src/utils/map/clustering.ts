import { Runner } from '../../types/runner';

/**
 * Seuil de regroupement : ~110m en degrés lat/lng.
 * Deux runners distants de moins de ce seuil sont fusionnés dans le même cluster.
 */
const CLUSTER_THRESHOLD = 0.001;

export interface RunnerCluster {
  id: string;
  location: { latitude: number; longitude: number };
  runners: Runner[];
}

/**
 * Regroupe les runners proches les uns des autres en clusters.
 * Un cluster de 1 runner = marker individuel.
 * Un cluster de 2+ runners = ClusterMarker.
 */
export function clusterRunners(runners: Runner[]): RunnerCluster[] {
  const clusters: RunnerCluster[] = [];

  for (const runner of runners) {
    let added = false;

    for (const cluster of clusters) {
      const dLat = Math.abs(runner.location.latitude - cluster.location.latitude);
      const dLng = Math.abs(runner.location.longitude - cluster.location.longitude);

      if (dLat <= CLUSTER_THRESHOLD && dLng <= CLUSTER_THRESHOLD) {
        cluster.runners.push(runner);
        added = true;
        break;
      }
    }

    if (!added) {
      clusters.push({
        id: `cluster-${runner.id}`,
        location: {
          latitude: runner.location.latitude,
          longitude: runner.location.longitude,
        },
        runners: [runner],
      });
    }
  }

  return clusters;
}
