import { Runner } from '../types/runner';
import { Location } from '../types/location';
import { calculateDistance } from './location';

export function filterRunnersByDistance(
  runners: Runner[],
  center: Location,
  radiusKm: number
): Runner[] {
  return runners.filter(runner => {
    const distance = calculateDistance(center, runner.location);
    return distance <= radiusKm;
  });
}