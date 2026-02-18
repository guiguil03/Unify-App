import { useState, useEffect } from 'react';
import { GroupMessage } from '../types/groupChat';
import { GroupChatsService } from '../services/GroupChatsService';
import { useAuth } from '../contexts/AuthContext';

export function useGroupChat(groupChatId: string) {
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    loadMessages();
  }, [groupChatId, user]);

  const loadMessages = async () => {
    if (!user) {
      setLoading(false);
      setMessages([]);
      return;
    }

    try {
      setLoading(true);
      const data = await GroupChatsService.getGroupMessages(groupChatId);
      setMessages(data);
    } catch (err: any) {
      if (__DEV__) console.error('Group chat messages load failed:', err);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (content: string) => {
    if (!user) return;

    try {
      const newMessage = await GroupChatsService.sendGroupMessage(groupChatId, content);
      setMessages((prev) => [newMessage, ...prev]);
    } catch (err: any) {
      if (__DEV__) console.error('Send group message failed:', err);
    }
  };

  return { messages, loading, sendMessage };
}
