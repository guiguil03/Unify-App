import { Message, ChatMessage } from '../types/message';
import { supabase } from '../config/supabase';
import { getCurrentUserFromDB, formatTime } from '../utils/supabaseHelpers';

export class MessagesService {
  /**
   * Récupère toutes les conversations de l'utilisateur actuel
   */
  static async getMessages(): Promise<Message[]> {
    try {
      const currentUser = await getCurrentUserFromDB();
      if (!currentUser) {
        throw new Error('Utilisateur non authentifié');
      }

      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          user1:users!conversations_user1_id_fkey(id, name, avatar),
          user2:users!conversations_user2_id_fkey(id, name, avatar)
        `)
        .or(`user1_id.eq.${currentUser.id},user2_id.eq.${currentUser.id}`)
        .order('last_message_time', { ascending: false });

      if (error) {
        console.error('Erreur lors de la récupération des conversations:', error);
        throw error;
      }

      // Transformer les données au format Message
      return (data || []).map((conv: any) => {
        const otherUser = conv.user1_id === currentUser.id ? conv.user2 : conv.user1;
        return {
          id: conv.id,
          contactId: otherUser.id,
          contactName: otherUser.name,
          lastMessage: conv.last_message || '',
          time: conv.last_message_time
            ? formatTime(conv.last_message_time)
            : formatTime(conv.created_at),
        };
      });
    } catch (error: any) {
      // Ne pas logger les erreurs d'authentification
      if (!error?.message?.includes('Utilisateur non authentifié')) {
        console.error('Erreur dans getMessages:', error);
      }
      throw error;
    }
  }

  /**
   * Récupère les messages d'une conversation
   */
  static async getChatMessages(contactId: string): Promise<ChatMessage[]> {
    try {
      const currentUser = await getCurrentUserFromDB();
      if (!currentUser) {
        throw new Error('Utilisateur non authentifié');
      }

      // Trouver ou créer la conversation
      const conversation = await this.getOrCreateConversation(currentUser.id, contactId);

      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('conversation_id', conversation.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Erreur lors de la récupération des messages:', error);
        throw error;
      }

      return (data || []).map((msg: any) => ({
        id: msg.id,
        content: msg.content,
        senderId: msg.sender_id,
        time: formatTime(msg.created_at),
      }));
    } catch (error) {
      console.error('Erreur dans getChatMessages:', error);
      throw error;
    }
  }

  /**
   * Envoie un message
   */
  static async sendMessage(contactId: string, content: string): Promise<ChatMessage> {
    try {
      const currentUser = await getCurrentUserFromDB();
      if (!currentUser) {
        throw new Error('Utilisateur non authentifié');
      }

      // Trouver ou créer la conversation
      const conversation = await this.getOrCreateConversation(currentUser.id, contactId);

      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          conversation_id: conversation.id,
          sender_id: currentUser.id,
          content,
        })
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        content: data.content,
        senderId: data.sender_id,
        time: formatTime(data.created_at),
      };
    } catch (error) {
      console.error('Erreur dans sendMessage:', error);
      throw error;
    }
  }

  /**
   * Obtient ou crée une conversation entre deux utilisateurs
   */
  private static async getOrCreateConversation(
    user1Id: string,
    user2Id: string
  ): Promise<any> {
    // Normaliser l'ordre des IDs pour éviter les doublons
    const [id1, id2] = user1Id < user2Id ? [user1Id, user2Id] : [user2Id, user1Id];

    // Chercher une conversation existante
    const { data: existing } = await supabase
      .from('conversations')
      .select('*')
      .eq('user1_id', id1)
      .eq('user2_id', id2)
      .single();

    if (existing) return existing;

    // Créer une nouvelle conversation
    const { data, error } = await supabase
      .from('conversations')
      .insert({
        user1_id: id1,
        user2_id: id2,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}