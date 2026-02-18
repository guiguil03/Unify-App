import { GroupChatPreview, GroupMessage, GroupMember } from '../types/groupChat';
import { supabase } from '../config/supabase';
import { getCurrentUserFromDB, formatTime } from '../utils/supabaseHelpers';

export class GroupChatsService {
  /**
   * Récupère tous les groupes de l'utilisateur actuel
   */
  static async getGroupChats(): Promise<GroupChatPreview[]> {
    try {
      const currentUser = await getCurrentUserFromDB();
      if (!currentUser) throw new Error('Utilisateur non authentifié');

      // Récupérer les groupes dont l'utilisateur est membre
      const { data, error } = await supabase
        .from('group_members')
        .select(`
          group_chat_id,
          group_chat:group_chats(id, name, last_message, last_message_time, created_at)
        `)
        .eq('user_id', currentUser.id);

      if (error) throw error;

      const groupIds = (data || []).map((row: any) => row.group_chat_id);
      if (groupIds.length === 0) return [];

      // Récupérer les membres de chaque groupe pour les avatars + count
      const { data: membersData, error: membersError } = await supabase
        .from('group_members')
        .select(`
          group_chat_id,
          user:users(id, name, avatar)
        `)
        .in('group_chat_id', groupIds);

      if (membersError) throw membersError;

      // Grouper les membres par groupe
      const membersByGroup: Record<string, any[]> = {};
      (membersData || []).forEach((row: any) => {
        const gid = row.group_chat_id;
        if (!membersByGroup[gid]) membersByGroup[gid] = [];
        membersByGroup[gid].push(row.user);
      });

      return (data || [])
        .map((row: any) => {
          const gc = row.group_chat;
          if (!gc) return null;
          const members = membersByGroup[gc.id] || [];
          return {
            id: gc.id,
            name: gc.name,
            lastMessage: gc.last_message || '',
            time: gc.last_message_time
              ? formatTime(gc.last_message_time)
              : formatTime(gc.created_at),
            memberCount: members.length,
            memberAvatars: members.slice(0, 3).map((m: any) => m?.avatar ?? null),
          } as GroupChatPreview;
        })
        .filter(Boolean) as GroupChatPreview[];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Récupère les messages d'un groupe
   */
  static async getGroupMessages(groupChatId: string): Promise<GroupMessage[]> {
    try {
      const currentUser = await getCurrentUserFromDB();
      if (!currentUser) throw new Error('Utilisateur non authentifié');

      const { data, error } = await supabase
        .from('group_chat_messages')
        .select(`
          id,
          content,
          sender_id,
          created_at,
          sender:users!group_chat_messages_sender_id_fkey(id, name, avatar)
        `)
        .eq('group_chat_id', groupChatId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((msg: any) => ({
        id: msg.id,
        content: msg.content,
        senderId: msg.sender_id,
        senderName: msg.sender?.name ?? 'Utilisateur',
        senderAvatar: msg.sender?.avatar ?? null,
        time: formatTime(msg.created_at),
      }));
    } catch (error) {
      throw error;
    }
  }

  /**
   * Envoie un message dans un groupe
   */
  static async sendGroupMessage(groupChatId: string, content: string): Promise<GroupMessage> {
    try {
      const currentUser = await getCurrentUserFromDB();
      if (!currentUser) throw new Error('Utilisateur non authentifié');

      const { data, error } = await supabase
        .from('group_chat_messages')
        .insert({
          group_chat_id: groupChatId,
          sender_id: currentUser.id,
          content,
        })
        .select(`
          id,
          content,
          sender_id,
          created_at,
          sender:users!group_chat_messages_sender_id_fkey(id, name, avatar)
        `)
        .single();

      if (error) throw error;

      // Mettre à jour last_message et last_message_time sur le groupe
      await supabase
        .from('group_chats')
        .update({
          last_message: content,
          last_message_time: data.created_at,
        })
        .eq('id', groupChatId);

      return {
        id: data.id,
        content: data.content,
        senderId: data.sender_id,
        senderName: data.sender?.name ?? 'Utilisateur',
        senderAvatar: data.sender?.avatar ?? null,
        time: formatTime(data.created_at),
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Crée un groupe de discussion
   */
  static async createGroupChat(name: string, memberIds: string[]): Promise<GroupChatPreview> {
    try {
      const currentUser = await getCurrentUserFromDB();
      if (!currentUser) throw new Error('Utilisateur non authentifié');

      // Créer le groupe
      const { data: group, error: groupError } = await supabase
        .from('group_chats')
        .insert({
          name,
          creator_id: currentUser.id,
        })
        .select()
        .single();

      if (groupError) throw groupError;

      // Ajouter le créateur comme admin + les membres
      const allMembers = [
        { group_chat_id: group.id, user_id: currentUser.id, role: 'admin' },
        ...memberIds.map((uid) => ({
          group_chat_id: group.id,
          user_id: uid,
          role: 'member' as const,
        })),
      ];

      const { error: membersError } = await supabase
        .from('group_members')
        .insert(allMembers);

      if (membersError) throw membersError;

      return {
        id: group.id,
        name: group.name,
        lastMessage: '',
        time: formatTime(group.created_at),
        memberCount: allMembers.length,
        memberAvatars: [],
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Récupère les membres d'un groupe
   */
  static async getGroupMembers(groupChatId: string): Promise<GroupMember[]> {
    try {
      const { data, error } = await supabase
        .from('group_members')
        .select(`
          role,
          user:users(id, name, avatar)
        `)
        .eq('group_chat_id', groupChatId);

      if (error) throw error;

      return (data || []).map((row: any) => ({
        id: row.user?.id,
        name: row.user?.name ?? 'Utilisateur',
        avatar: row.user?.avatar ?? null,
        role: row.role,
      }));
    } catch (error) {
      throw error;
    }
  }
}
