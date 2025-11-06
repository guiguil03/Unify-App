// src/services/EventsService.ts
import { Event } from '../types/event';
import { supabase } from '../config/supabase';
import { formatDate, formatTime } from '../utils/supabaseHelpers';

export class EventsService {
  /**
   * Récupère tous les événements à venir
   */
  static async getEvents(): Promise<Event[]> {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .gte('date', new Date().toISOString())
        .order('date', { ascending: true });

      if (error) {
        console.error('Erreur lors de la récupération des événements:', error);
        throw error;
      }

      // Transformer les données au format Event
      return (data || []).map((event) => {
        const eventDate = new Date(event.date);
        return {
          id: event.id,
          title: event.title,
          date: `${formatDate(event.date)} - ${formatTime(event.date)}`,
          location: event.location,
          participants: event.participants || 0,
          description: event.description || '',
        };
      });
    } catch (error) {
      console.error('Erreur dans getEvents:', error);
      throw error;
    }
  }

  /**
   * Crée un nouvel événement
   */
  static async createEvent(eventData: {
    title: string;
    description?: string;
    date: string;
    location: string;
    latitude?: number;
    longitude?: number;
    maxParticipants?: number;
    distance?: number;
    difficulty?: 'easy' | 'medium' | 'hard';
  }): Promise<Event> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Utilisateur non authentifié');
      }

      // Obtenir l'utilisateur depuis la table users
      const { data: dbUser } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();

      const { data, error } = await supabase
        .from('events')
        .insert({
          title: eventData.title,
          description: eventData.description,
          date: eventData.date,
          location: eventData.location,
          latitude: eventData.latitude,
          longitude: eventData.longitude,
          created_by: dbUser?.id,
          max_participants: eventData.maxParticipants,
          distance: eventData.distance,
          difficulty: eventData.difficulty,
        })
        .select()
        .single();

      if (error) throw error;

      const eventDate = new Date(data.date);
      return {
        id: data.id,
        title: data.title,
        date: `${formatDate(data.date)} - ${formatTime(data.date)}`,
        location: data.location,
        participants: data.participants || 0,
        description: data.description || '',
      };
    } catch (error) {
      console.error('Erreur dans createEvent:', error);
      throw error;
    }
  }

  /**
   * Rejoint un événement
   */
  static async joinEvent(eventId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Utilisateur non authentifié');
      }

      // Obtenir l'utilisateur depuis la table users
      const { data: dbUser } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();

      if (!dbUser) {
        throw new Error('Utilisateur non trouvé dans la base de données');
      }

      const { error } = await supabase
        .from('event_participants')
        .insert({
          event_id: eventId,
          user_id: dbUser.id,
          status: 'registered',
        });

      if (error) {
        // Si l'utilisateur est déjà inscrit, c'est ok
        if (error.code !== '23505') { // Code d'erreur pour violation de contrainte unique
          throw error;
        }
      }
    } catch (error) {
      console.error('Erreur dans joinEvent:', error);
      throw error;
    }
  }

  /**
   * Quitte un événement
   */
  static async leaveEvent(eventId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Utilisateur non authentifié');
      }

      // Obtenir l'utilisateur depuis la table users
      const { data: dbUser } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();

      if (!dbUser) {
        throw new Error('Utilisateur non trouvé dans la base de données');
      }

      const { error } = await supabase
        .from('event_participants')
        .delete()
        .eq('event_id', eventId)
        .eq('user_id', dbUser.id);

      if (error) throw error;
    } catch (error) {
      console.error('Erreur dans leaveEvent:', error);
      throw error;
    }
  }
}