export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  if (hours > 0) {
    return `${hours}:${padZero(minutes)}:${padZero(remainingSeconds)}`;
  }
  return `${padZero(minutes)}:${padZero(remainingSeconds)}`;
}

function padZero(num: number): string {
  return num.toString().padStart(2, '0');
}

export function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) {
    const distanceMeters = distanceKm * 1000;
    return `${distanceMeters.toFixed(0)} m`;
  }
  return `${distanceKm.toFixed(2)} km`;
}