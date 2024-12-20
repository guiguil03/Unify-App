import { useState, useEffect } from 'react';
import { ChatMessage } from '../types/message';
import { MessagesService } from '../services/MessagesService';

export function useChat(contactId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMessages();
  }, [contactId]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const data = await MessagesService.getChatMessages(contactId);
      setMessages(data);
    } catch (err) {
      console.error('Error loading chat messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (content: string) => {
    try {
      const newMessage = await MessagesService.sendMessage(contactId, content);
      setMessages(prev => [newMessage, ...prev]);
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  return { messages, loading, sendMessage };
}