export interface Event {
  id: string;
  title: string;
  date: string;          // formatted label, e.g. "15 jan. - 08:00"
  rawDate: string;       // ISO date string for parsing
  location: string;
  participants: number;
  description: string;
  imageUrl?: string;
  maxParticipants?: number;
  isParticipating?: boolean;
  distance?: number;                         // km
  difficulty?: 'easy' | 'medium' | 'hard';
}
