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

export function formatRelativeTime(dateInput: string | Date): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  const timestamp = date.getTime();

  if (Number.isNaN(timestamp)) {
    return "à l'instant";
  }

  const now = Date.now();
  const diffMs = Math.max(0, now - timestamp);

  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) {
    return "à l'instant";
  }

  if (minutes < 60) {
    return `il y a ${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `il y a ${hours} h`;
  }

  const days = Math.floor(hours / 24);
  if (days < 7) {
    return `il y a ${days} j`;
  }

  const weeks = Math.floor(days / 7);
  if (weeks < 5) {
    return `il y a ${weeks} sem`;
  }

  const months = Math.floor(days / 30);
  if (months < 12) {
    return `il y a ${months} mois`;
  }

  const years = Math.floor(days / 365);
  return `il y a ${years} an${years > 1 ? 's' : ''}`;
}