// src/hooks/useEvents.ts
import { useState, useEffect, useCallback } from 'react';
import { Event } from '../types/event';
import { EventsService } from '../services/EventsService';

export const useEvents = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedEvents = await EventsService.getEvents();
      setEvents(fetchedEvents);
    } catch (err: any) {
      if (__DEV__) console.error('Events load failed:', err);
      if (!err?.message?.includes('Utilisateur non authentifié')) {
        setError('Unable to fetch events');
      } else {
        setEvents([]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const toggleParticipation = useCallback(
    async (eventId: string, isParticipating: boolean) => {
      try {
        if (isParticipating) {
          await EventsService.leaveEvent(eventId);
        } else {
          await EventsService.joinEvent(eventId);
        }
        setEvents(prev =>
          prev.map(e =>
            e.id === eventId
              ? {
                  ...e,
                  isParticipating: !isParticipating,
                  participants: e.participants + (isParticipating ? -1 : 1),
                }
              : e
          )
        );
      } catch {
        await fetchEvents();
      }
    },
    [fetchEvents]
  );

  return { events, loading, error, refetch: fetchEvents, toggleParticipation };
};
