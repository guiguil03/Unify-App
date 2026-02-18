import { Runner } from '../types/runner';
import { Location } from '../types/location';
import { calculateDistance } from './location';
import { Settings } from '../types/settings';

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

/**
 * Convertit une allure formatée (ex: "5:30 min/km") en secondes par km
 */
function parsePaceToSeconds(pace: string): number | null {
  if (!pace) return null;
  
  // Format "X:XX min/km" ou "X min/km"
  const match = pace.match(/(\d+):?(\d*)\s*min\/km/i);
  if (match) {
    const minutes = parseInt(match[1], 10);
    const seconds = match[2] ? parseInt(match[2], 10) : 0;
    return minutes * 60 + seconds;
  }
  
  return null;
}

/**
 * Filtre les coureurs selon les préférences de l'utilisateur
 */
export function filterRunnersByPreferences(
  runners: Runner[],
  settings: Settings,
  currentUserGender?: string,
  currentUserAveragePace?: string,
  currentUserPreferredTime?: string
): Runner[] {
  let filtered = [...runners];

  // Filtre par genre — les coureurs sans genre renseigné sont inclus
  if (settings.sameGenderOnly && currentUserGender) {
    filtered = filtered.filter(runner => !runner.gender || runner.gender === currentUserGender);
  }

  // Filtre par allure similaire (±1 min/km = ±60 secondes)
  // Les coureurs sans allure renseignée sont inclus (on ne les exclut pas faute de données)
  if (settings.similarPaceOnly && currentUserAveragePace) {
    const currentPaceSeconds = parsePaceToSeconds(currentUserAveragePace);
    if (currentPaceSeconds !== null) {
      filtered = filtered.filter(runner => {
        if (!runner.averagePace) return true; // pas de données → inclure
        const runnerPaceSeconds = parsePaceToSeconds(runner.averagePace);
        if (runnerPaceSeconds === null) return true; // format invalide → inclure
        // ±1 min/km = ±60 secondes
        return Math.abs(runnerPaceSeconds - currentPaceSeconds) <= 60;
      });
    }
  }

  // Filtre par horaires similaires — les coureurs sans horaire renseigné sont inclus
  if (settings.similarSchedule && currentUserPreferredTime) {
    filtered = filtered.filter(runner => !runner.preferredTime || runner.preferredTime === currentUserPreferredTime);
  }

  return filtered;
}
