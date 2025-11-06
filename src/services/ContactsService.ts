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