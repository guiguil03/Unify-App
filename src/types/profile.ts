export interface ProfileStats {
  totalDistance: number;
  totalTime: string;
  sessions: number;
  averagePace: string;
}

export interface Profile {
  id: string;
  name: string;
  avatar?: string;
  bio?: string;
  level?: string;
  goal?: string;
  preferredTime?: string;
  preferredTerrain?: string;
  groupPreference?: string;
  memberSince?: string;
  stats: ProfileStats;
}