// src/hooks/useEvents.ts
import { useState, useEffect } from 'react';
import { Event } from '../types/event';
import { EventsService } from '../services/EventsService';

export const useEvents = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        setError(null);
        const fetchedEvents = await EventsService.getEvents();
        setEvents(fetchedEvents);
      } catch (err) {
        setError('Unable to fetch events');
        console.error('Error fetching events:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  return { events, loading, error };
};