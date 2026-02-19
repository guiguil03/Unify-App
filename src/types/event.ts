export interface Event {
  id: string;
  title: string;
  date: string;
  location: string;
  participants: number;
  description: string;
  imageUrl?: string;
  maxParticipants?: number;
  isParticipating?: boolean;
}
