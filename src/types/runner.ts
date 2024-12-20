import { Location } from './location';

export interface Runner {
  id: string;
  name: string;
  location: Location;
  distance: number;
  pace: string;
  avatar?: string;
  bio?: string;
}