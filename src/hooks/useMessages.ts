import { useState, useEffect } from 'react';
import { Message } from '../types/message';
import { MessagesService } from '../services/MessagesService';
import { useAuth } from '../contexts/AuthContext';

export function useMessages() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    loadMessages();
  }, [user]);

  const loadMessages = async () => {
    // Si l'utilisateur n'est pas authentifié, retourner une liste vide
    if (!user) {
      setLoading(false);
      setMessages([]);
      return;
    }

    try {
      setLoading(true);
      const data = await MessagesService.getMessages();
      setMessages(data);
      setError(null);
    } catch (err: any) {
      // Gérer silencieusement les erreurs d'authentification
      if (err?.message?.includes('Utilisateur non authentifié')) {
        setMessages([]);
        setError(null);
      } else {
        setError('Erreur lors du chargement des messages');
        if (!err?.message?.includes('Utilisateur non authentifié')) {
          console.error('Error loading messages:', err);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return { messages, loading, error };
}