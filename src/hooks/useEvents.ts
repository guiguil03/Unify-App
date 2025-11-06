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
        // Les événements peuvent être vus même sans authentification
        const fetchedEvents = await EventsService.getEvents();
        setEvents(fetchedEvents);
      } catch (err: any) {
        // Gérer silencieusement les erreurs
        if (!err?.message?.includes('Utilisateur non authentifié')) {
          setError('Unable to fetch events');
          console.error('Error fetching events:', err);
        } else {
          setEvents([]);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  return { events, loading, error };
};