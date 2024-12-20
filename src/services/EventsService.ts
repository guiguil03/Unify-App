// src/services/EventsService.ts
import { Event } from '../types/event';

export class EventsService {
  static async getEvents(): Promise<Event[]> {
    // Simulate fetching events from an API or database
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          {
            id: '1',
            title: 'Course matinale en groupe',
            date: '25 Mars 2024 - 7h00',
            location: 'Parc central',
            participants: 10,
            description: 'Join us for a morning run in the park.',
          },
          {
            id: '2',
            title: 'Marathon des débutants',
            date: '1 Avril 2024 - 9h00',
            participants: 20,
            location: 'Stade municipal',
            description: 'A marathon event for beginners.',
          },
        ]);
      }, 1000);
    });
  }
}