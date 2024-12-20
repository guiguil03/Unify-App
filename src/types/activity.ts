export interface ActivityRoute {
  coordinates: {
    latitude: number;
    longitude: number;
    timestamp: number;
  }[];
  pauses: {
    startTime: number;
    endTime: number;
    location: {
      latitude: number;
      longitude: number;
    };
  }[];
}

export interface Activity {
  id: string;
  date: string;
  distance: number;
  duration: string;
  pace: string;
  route?: ActivityRoute;
}