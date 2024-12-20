// src/services/ProfileService.ts
import { Profile } from '../types/profile';

export class ProfileService {
  static async getProfile(): Promise<Profile> {
    // Simulate fetching profile from an API or database
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          id: '1',
          name: 'John Doe',
          avatar: 'https://example.com/avatar.jpg',
          bio: 'Runner and fitness enthusiast',
          stats: {
            totalDistance: 42.5,
            totalTime: '3h45',
            sessions: 8,
            averagePace: '5:20 min/km',
          },
        });
      }, 1000);
    });
  }
}