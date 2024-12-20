import { useState, useEffect } from 'react';
import { Message } from '../types/message';
import { MessagesService } from '../services/MessagesService';

export function useMessages() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const data = await MessagesService.getMessages();
      setMessages(data);
      setError(null);
    } catch (err) {
      setError('Erreur lors du chargement des messages');
      console.error('Error loading messages:', err);
    } finally {
      setLoading(false);
    }
  };

  return { messages, loading, error };
}