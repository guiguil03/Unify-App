import { useState, useEffect } from 'react';
import { ChatMessage } from '../types/message';
import { MessagesService } from '../services/MessagesService';
import { useAuth } from '../contexts/AuthContext';

export function useChat(contactId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    loadMessages();
  }, [contactId, user]);

  const loadMessages = async () => {
    // Si l'utilisateur n'est pas authentifié, retourner une liste vide
    if (!user) {
      setLoading(false);
      setMessages([]);
      return;
    }

    try {
      setLoading(true);
      const data = await MessagesService.getChatMessages(contactId);
      setMessages(data);
    } catch (err: any) {
      // Gérer silencieusement les erreurs d'authentification
      if (!err?.message?.includes('Utilisateur non authentifié')) {
        console.error('Error loading chat messages:', err);
      }
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (content: string) => {
    if (!user) {
      return;
    }

    try {
      const newMessage = await MessagesService.sendMessage(contactId, content);
      setMessages(prev => [newMessage, ...prev]);
    } catch (err: any) {
      // Gérer silencieusement les erreurs d'authentification
      if (!err?.message?.includes('Utilisateur non authentifié')) {
        console.error('Error sending message:', err);
      }
    }
  };

  return { messages, loading, sendMessage };
}