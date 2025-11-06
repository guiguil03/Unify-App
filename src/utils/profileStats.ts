/**
 * Utilitaires pour gérer les statistiques de profil
 */

/**
 * Met à jour les statistiques du profil utilisateur dans Supabase
 */
export async function updateUserProfileStats(userId: string, stats: {
  totalDistance: number;
  totalTime: string;
  sessions: number;
  averagePace: string;
}) {
  const { supabase } = await import('../config/supabase');

  const { error } = await supabase
    .from('users')
    .update({
      total_distance: stats.totalDistance,
      total_time: stats.totalTime,
      sessions: stats.sessions,
      average_pace: stats.averagePace,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) {
    console.error('Erreur lors de la mise à jour des statistiques:', error);
    throw error;
  }
}

/**
 * Calcule les nouvelles statistiques après l'ajout d'une activité
 */
export function calculateNewStats(
  currentStats: {
    totalDistance: number;
    totalTime: string;
    sessions: number;
    averagePace: string;
  },
  newDistance: number,
  newDurationSeconds: number
) {
  const newTotalDistance = currentStats.totalDistance + newDistance;
  const currentTimeSeconds = parseDurationToSeconds(currentStats.totalTime);
  const newTotalTimeSeconds = currentTimeSeconds + newDurationSeconds;
  const newSessions = currentStats.sessions + 1;
  const newAveragePace = newTotalDistance > 0
    ? formatPace(Math.round(newTotalTimeSeconds / newTotalDistance))
    : currentStats.averagePace;

  return {
    totalDistance: newTotalDistance,
    totalTime: formatDuration(newTotalTimeSeconds),
    sessions: newSessions,
    averagePace: newAveragePace,
  };
}

/**
 * Convertit une durée formatée (ex: "30:00" ou "28 min") en secondes
 */
function parseDurationToSeconds(duration: string): number {
  // Format "MM:SS" ou "HH:MM:SS"
  if (duration.includes(':')) {
    const parts = duration.split(':').map(Number);
    if (parts.length === 2) {
      return parts[0] * 60 + parts[1];
    } else if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
  }

  // Format "XX min" ou "Xh XX min"
  const minMatch = duration.match(/(\d+)\s*min/);
  const hourMatch = duration.match(/(\d+)\s*h/);

  let seconds = 0;
  if (hourMatch) {
    seconds += parseInt(hourMatch[1]) * 3600;
  }
  if (minMatch) {
    seconds += parseInt(minMatch[1]) * 60;
  }

  return seconds || 0;
}

/**
 * Formate une durée en secondes vers "XXh XX min" ou "XX min"
 */
function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes} min`;
  }
  return `${minutes} min`;
}

/**
 * Formate une allure en secondes vers "X:XX min/km"
 */
function formatPace(paceSeconds: number): string {
  const minutes = Math.floor(paceSeconds / 60);
  const seconds = paceSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')} min/km`;
}

