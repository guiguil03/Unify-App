export interface ProfileStats {
  totalDistance: number;
  totalTime: string;
  sessions: number;
  averagePace: string;
}

export interface Profile {
  id: string;
  name: string;
  avatar: string;
  bio: string;
  stats: ProfileStats;
}