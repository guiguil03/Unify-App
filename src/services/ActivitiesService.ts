// src/services/ActivitiesService.ts
import { Activity } from '../types/activity';

export class ActivitiesService {
  static async getActivities(): Promise<Activity[]> {
    // Simulate fetching activities from an API or database
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          {
            id: '1',
            date: '20 Mars 2024',
            distance: 5.2,
            duration: '28 min',
            pace: '5:23 min/km',
          },
          {
            id: '2',
            date: '18 Mars 2024',
            distance: 3.8,
            duration: '22 min',
            pace: '5:47 min/km',
          },
        ]);
      }, 1000);
    });
  }
}