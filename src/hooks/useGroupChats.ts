import { useState, useEffect, useCallback } from 'react';
import { GroupChatPreview } from '../types/groupChat';
import { GroupChatsService } from '../services/GroupChatsService';
import { useAuth } from '../contexts/AuthContext';

export function useGroupChats() {
  const [groupChats, setGroupChats] = useState<GroupChatPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const loadGroupChats = useCallback(async () => {
    if (!user) {
      setLoading(false);
      setGroupChats([]);
      return;
    }

    try {
      setLoading(true);
      const data = await GroupChatsService.getGroupChats();
      setGroupChats(data);
      setError(null);
    } catch (err: any) {
      if (__DEV__) console.error('Group chats load failed:', err);
      if (err?.message?.includes('Utilisateur non authentifié')) {
        setGroupChats([]);
        setError(null);
      } else {
        setError('Erreur lors du chargement des groupes');
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadGroupChats();
  }, [loadGroupChats]);

  return { groupChats, loading, error, refetch: loadGroupChats };
}
