import { Contact } from '../types/contact';
import { supabase } from '../config/supabase';
import { getCurrentUserFromDB } from '../utils/supabaseHelpers';

export class ContactsService {
  /**
   * Récupère tous les contacts acceptés de l'utilisateur actuel
   */
  static async getContacts(): Promise<Contact[]> {
    try {
      const currentUser = await getCurrentUserFromDB();
      if (!currentUser) {
        throw new Error('Utilisateur non authentifié');
      }

      const { data, error } = await supabase
        .from('contacts')
        .select(`
          *,
          contact:users!contacts_contact_id_fkey(id, name, avatar)
        `)
        .eq('user_id', currentUser.id)
        .eq('status', 'accepted');

      if (error) {
        console.error('Erreur lors de la récupération des contacts:', error);
        throw error;
      }

      return (data || []).map((contact: any) => ({
        id: contact.contact.id,
        name: contact.contact.name,
        lastActivity: contact.last_interaction
          ? this.formatLastActivity(contact.last_interaction)
          : 'Jamais',
        avatar: contact.contact.avatar,
      }));
    } catch (error: any) {
      // Ne pas logger les erreurs d'authentification
      if (!error?.message?.includes('Utilisateur non authentifié')) {
        console.error('Erreur dans getContacts:', error);
      }
      throw error;
    }
  }

  /**
   * Ajoute un contact (envoie une demande)
   */
  static async addContact(contactId: string): Promise<Contact> {
    try {
      const currentUser = await getCurrentUserFromDB();
      if (!currentUser) {
        throw new Error('Utilisateur non authentifié');
      }

      // Récupérer les informations du contact
      const { data: contactUser, error: userError } = await supabase
        .from('users')
        .select('id, name, avatar')
        .eq('id', contactId)
        .single();

      if (userError || !contactUser) {
        throw new Error('Contact non trouvé');
      }

      // Créer ou mettre à jour la relation de contact
      const { data, error } = await supabase
        .from('contacts')
        .upsert(
          {
            user_id: currentUser.id,
            contact_id: contactId,
            status: 'pending',
          },
          {
            onConflict: 'user_id,contact_id',
          }
        )
        .select()
        .single();

      if (error) {
        // Si la relation existe déjà, la récupérer
        if (error.code === '23505') {
          const { data: existing } = await supabase
            .from('contacts')
            .select('*')
            .eq('user_id', currentUser.id)
            .eq('contact_id', contactId)
            .single();

          if (existing) {
            return {
              id: contactUser.id,
              name: contactUser.name,
              lastActivity: 'À l\'instant',
              avatar: contactUser.avatar,
            };
          }
        }
        throw error;
      }

      return {
        id: contactUser.id,
        name: contactUser.name,
        lastActivity: 'À l\'instant',
        avatar: contactUser.avatar,
      };
    } catch (error) {
      console.error('Erreur dans addContact:', error);
      throw error;
    }
  }

  /**
   * Accepte une demande de contact
   */
  static async acceptContact(contactId: string): Promise<void> {
    try {
      const currentUser = await getCurrentUserFromDB();
      if (!currentUser) {
        throw new Error('Utilisateur non authentifié');
      }

      // Mettre à jour le statut de la demande
      const { error } = await supabase
        .from('contacts')
        .update({
          status: 'accepted',
          last_interaction: new Date().toISOString(),
        })
        .eq('user_id', currentUser.id)
        .eq('contact_id', contactId);

      if (error) throw error;
    } catch (error) {
      console.error('Erreur dans acceptContact:', error);
      throw error;
    }
  }

  /**
   * Recherche des utilisateurs par nom
   */
  static async searchUsers(query: string): Promise<Contact[]> {
    try {
      const currentUser = await getCurrentUserFromDB();
      if (!currentUser) {
        throw new Error('Utilisateur non authentifié');
      }

      if (!query.trim()) {
        return [];
      }

      // Rechercher des utilisateurs (exclure l'utilisateur actuel)
      const { data, error } = await supabase
        .from('users')
        .select('id, name, avatar')
        .neq('id', currentUser.id)
        .ilike('name', `%${query}%`)
        .limit(20);

      if (error) throw error;

      return (data || []).map((user: any) => ({
        id: user.id,
        name: user.name,
        avatar: user.avatar,
        lastActivity: 'Nouveau',
      }));
    } catch (error) {
      console.error('Erreur dans searchUsers:', error);
      throw error;
    }
  }

  /**
   * Récupère les demandes de contact en attente
   */
  static async getPendingRequests(): Promise<Contact[]> {
    try {
      const currentUser = await getCurrentUserFromDB();
      if (!currentUser) {
        throw new Error('Utilisateur non authentifié');
      }

      // Récupérer les demandes envoyées vers l'utilisateur actuel
      const { data, error } = await supabase
        .from('contacts')
        .select(`
          *,
          sender:users!contacts_user_id_fkey(id, name, avatar)
        `)
        .eq('contact_id', currentUser.id)
        .eq('status', 'pending');

      if (error) throw error;

      return (data || []).map((request: any) => ({
        id: request.sender.id,
        name: request.sender.name,
        avatar: request.sender.avatar,
        lastActivity: 'Demande en attente',
      }));
    } catch (error: any) {
      if (!error?.message?.includes('Utilisateur non authentifié')) {
        console.error('Erreur dans getPendingRequests:', error);
      }
      throw error;
    }
  }

  /**
   * Accepte une demande de contact (en tant que destinataire)
   */
  static async acceptContactRequest(senderId: string): Promise<void> {
    try {
      const currentUser = await getCurrentUserFromDB();
      if (!currentUser) {
        throw new Error('Utilisateur non authentifié');
      }

      // Mettre à jour la demande reçue
      const { error: updateError } = await supabase
        .from('contacts')
        .update({
          status: 'accepted',
          last_interaction: new Date().toISOString(),
        })
        .eq('user_id', senderId)
        .eq('contact_id', currentUser.id);

      if (updateError) throw updateError;

      // Créer la relation inverse pour que les deux utilisateurs soient amis
      const { error: insertError } = await supabase
        .from('contacts')
        .upsert({
          user_id: currentUser.id,
          contact_id: senderId,
          status: 'accepted',
          last_interaction: new Date().toISOString(),
        });

      if (insertError) throw insertError;
    } catch (error) {
      console.error('Erreur dans acceptContactRequest:', error);
      throw error;
    }
  }

  /**
   * Refuse une demande de contact
   */
  static async rejectContactRequest(senderId: string): Promise<void> {
    try {
      const currentUser = await getCurrentUserFromDB();
      if (!currentUser) {
        throw new Error('Utilisateur non authentifié');
      }

      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('user_id', senderId)
        .eq('contact_id', currentUser.id);

      if (error) throw error;
    } catch (error) {
      console.error('Erreur dans rejectContactRequest:', error);
      throw error;
    }
  }

  /**
   * Supprime un contact
   */
  static async removeContact(contactId: string): Promise<void> {
    try {
      const currentUser = await getCurrentUserFromDB();
      if (!currentUser) {
        throw new Error('Utilisateur non authentifié');
      }

      // Supprimer les deux relations
      await supabase
        .from('contacts')
        .delete()
        .or(`and(user_id.eq.${currentUser.id},contact_id.eq.${contactId}),and(user_id.eq.${contactId},contact_id.eq.${currentUser.id})`);
    } catch (error) {
      console.error('Erreur dans removeContact:', error);
      throw error;
    }
  }

  /**
   * Formate la dernière activité pour l'affichage
   */
  private static formatLastActivity(date: string): string {
    const now = new Date();
    const activityDate = new Date(date);
    const diffMs = now.getTime() - activityDate.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) {
      return 'Il y a moins d\'une heure';
    } else if (diffHours < 24) {
      return `Il y a ${diffHours}h`;
    } else if (diffDays === 1) {
      return 'Il y a 1j';
    } else {
      return `Il y a ${diffDays}j`;
    }
  }
}