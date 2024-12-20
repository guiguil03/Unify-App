import { Activity } from '../types/activity';

export const MOCK_ACTIVITIES: Activity[] = [
  {
    id: '1',
    date: '20 Mars 2024',
    distance: 5.2,
    duration: '28:00',
    pace: '5:23 min/km',
    route: {
      coordinates: [
        { latitude: 48.8584, longitude: 2.2945, timestamp: 1710931200000 },
        { latitude: 48.8594, longitude: 2.2965, timestamp: 1710931500000 },
        { latitude: 48.8604, longitude: 2.2985, timestamp: 1710931800000 }
      ],
      pauses: [
        {
          startTime: 1710931500000,
          endTime: 1710931800000,
          location: { latitude: 48.8594, longitude: 2.2965 }
        }
      ]
    }
  },
  {
    id: '2',
    date: '18 Mars 2024',
    distance: 3.8,
    duration: '22:00',
    pace: '5:47 min/km',
    route: {
      coordinates: [
        { latitude: 48.8584, longitude: 2.2945, timestamp: 1710758400000 },
        { latitude: 48.8594, longitude: 2.2965, timestamp: 1710758700000 }
      ],
      pauses: []
    }
  }
];