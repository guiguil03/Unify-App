export type RouteDifficulty = 'easy' | 'medium' | 'hard' | 'expert';

export interface RoutePoint {
  latitude: number;
  longitude: number;
  elevation?: number;
  orderIndex: number;
}

export interface Route {
  id: string;
  userId: string;
  title: string;
  description?: string;
  distance: number; // en km
  durationEstimate?: number; // en minutes
  difficulty?: RouteDifficulty;
  isPublic: boolean;
  isShared: boolean;
  shareCode?: string;
  points: RoutePoint[];
  createdAt: string;
  updatedAt: string;
  // Informations du créateur
  creatorName?: string;
  creatorAvatar?: string;
}

export interface CreateRouteData {
  title: string;
  description?: string;
  distance: number;
  durationEstimate?: number;
  difficulty?: RouteDifficulty;
  isPublic: boolean;
  isShared: boolean;
  points: Omit<RoutePoint, 'orderIndex'>[];
}

export interface ShareRouteData {
  routeId: string;
  shareCode: string;
}

