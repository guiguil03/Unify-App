import { Contact, ContactRelationshipStatus, ContactRequest } from '../types/contact';
import { supabase } from '../config/supabase';
import { getCurrentUserFromDB } from '../utils/supabaseHelpers';
import { NotificationService } from './NotificationService';

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

      const [sentResult, receivedResult] = await Promise.all([
        supabase
          .from('contacts')
          .select(`
            last_interaction,
            contact:users!contacts_contact_id_fkey(id, name, avatar)
          `)
          .eq('user_id', currentUser.id)
          .eq('status', 'accepted'),
        supabase
          .from('contacts')
          .select(`
            last_interaction,
            sender:users!contacts_user_id_fkey(id, name, avatar)
          `)
          .eq('contact_id', currentUser.id)
          .eq('status', 'accepted'),
      ]);

      if (sentResult.error) {
        throw sentResult.error;
      }

      if (receivedResult.error) {
        throw receivedResult.error;
      }

      // Construire des ensembles pour symétrie
      const sentAccepted = new Map<string, any>();
      const receivedAccepted = new Map<string, any>();

      (sentResult.data || []).forEach((relation: any) => {
        if (relation?.contact?.id) {
          sentAccepted.set(relation.contact.id, relation);
        }
      });

      (receivedResult.data || []).forEach((relation: any) => {
        if (relation?.sender?.id) {
          receivedAccepted.set(relation.sender.id, relation);
        }
      });

      // Combiner tous les IDs des deux côtés (sent et received)
      const allContactIds = new Set([
        ...Array.from(sentAccepted.keys()),
        ...Array.from(receivedAccepted.keys())
      ]);

      // Créer la liste des contacts (inclut ceux qui ont au moins une relation acceptée)
      const contactsList: Contact[] = Array.from(allContactIds).map(id => {
        const s = sentAccepted.get(id);
        const r = receivedAccepted.get(id);
        const name = (s?.contact?.name) || (r?.sender?.name) || 'Utilisateur';
        const avatar = (s?.contact?.avatar) || (r?.sender?.avatar);
        // Choisir la dernière interaction la plus récente si dispo
        const last = [s?.last_interaction, r?.last_interaction]
          .filter(Boolean)
          .sort((a: string, b: string) => new Date(b).getTime() - new Date(a).getTime())[0];
        return {
          id,
          name,
          avatar,
          lastActivity: last ? this.formatLastActivity(last) : 'Jamais',
        } as Contact;
      });

      return contactsList;
    } catch (error: any) {
      // Ne pas logger les erreurs d'authentification
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

      // Vérifier l'état actuel de la relation
      const { data: existingRelationships, error: existingError } = await supabase
        .from('contacts')
        .select('user_id, contact_id, status')
        .or(`and(user_id.eq.${currentUser.id},contact_id.eq.${contactId}),and(user_id.eq.${contactId},contact_id.eq.${currentUser.id})`);

      if (existingError) {
        throw existingError;
      }

      // Vérifier s'il y a une demande entrante (l'autre utilisateur nous a déjà envoyé une demande)
      let hasIncomingRequest = false;
      if (existingRelationships && existingRelationships.length > 0) {
        for (const relation of existingRelationships) {
          const { user_id, contact_id, status } = relation as { user_id: string; contact_id: string; status: string };

          const isCurrentUserSender = user_id === currentUser.id;
          const isCurrentUserRecipient = contact_id === currentUser.id;

          if (status === 'accepted') {
            throw new Error('ALREADY_FRIENDS');
          }

          if (status === 'blocked') {
            throw new Error('CONTACT_BLOCKED');
          }

          if (status === 'pending') {
            if (isCurrentUserSender) {
              throw new Error('REQUEST_ALREADY_SENT');
            }

            if (isCurrentUserRecipient) {
              // Au lieu de lancer une erreur, on va accepter automatiquement la demande
              hasIncomingRequest = true;
            }
          }
        }
      }

      // Si une demande entrante existe, l'accepter automatiquement
      if (hasIncomingRequest) {
        await this.acceptContactRequest(contactId);
        
        // Récupérer les informations du contact pour le retour
        const { data: contactUser, error: userError } = await supabase
          .from('users')
          .select('id, name, avatar')
          .eq('id', contactId)
          .single();

        if (userError || !contactUser) {
          throw new Error('Contact non trouvé');
        }

        return {
          id: contactUser.id,
          name: contactUser.name,
          lastActivity: 'À l\'instant',
          avatar: contactUser.avatar,
        };
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
      const { error } = await supabase
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
        );

      if (error) {
        throw error;
      }

      // Envoyer une notification push au destinataire
      try {
        const token = await NotificationService.getRecipientToken(contactId);
        if (token) {
          await NotificationService.sendPushNotification(
            token,
            'Nouvelle demande de contact',
            `${currentUser.name} souhaite vous rejoindre`,
            { type: 'contact_request', senderId: currentUser.id }
          );
        }
      } catch {}

      return {
        id: contactUser.id,
        name: contactUser.name,
        lastActivity: 'À l\'instant',
        avatar: contactUser.avatar,
      };
    } catch (error) {
      throw error;
    }
  }

  static async getRelationshipsMap(): Promise<Record<string, ContactRelationshipStatus>> {
    try {
      const currentUser = await getCurrentUserFromDB();
      if (!currentUser) {
        throw new Error('Utilisateur non authentifié');
      }

      const [sentResult, receivedResult] = await Promise.all([
        supabase
          .from('contacts')
          .select('contact_id, status')
          .eq('user_id', currentUser.id),
        supabase
          .from('contacts')
          .select('user_id, status')
          .eq('contact_id', currentUser.id),
      ]);

      if (sentResult.error) {
        throw sentResult.error;
      }

      if (receivedResult.error) {
        throw receivedResult.error;
      }

      const relationships: Record<string, ContactRelationshipStatus> = {};

      const sentAccepted = new Set<string>();
      const receivedAccepted = new Set<string>();
      const sentPending = new Set<string>();
      const receivedPending = new Set<string>();

      (sentResult.data || []).forEach((relation: any) => {
        if (relation.status === 'accepted') {
          sentAccepted.add(relation.contact_id);
        } else if (relation.status === 'pending') {
          sentPending.add(relation.contact_id);
        }
      });

      (receivedResult.data || []).forEach((relation: any) => {
        if (relation.status === 'accepted') {
          receivedAccepted.add(relation.user_id);
        } else if (relation.status === 'pending') {
          receivedPending.add(relation.user_id);
        }
      });

      // friends seulement si symétrique
      const mutualFriends = Array.from(sentAccepted).filter(id => receivedAccepted.has(id));
      mutualFriends.forEach(id => {
        relationships[id] = 'friends';
      });

      // pending: demandes envoyées non encore acceptées et pas déjà amis
      sentPending.forEach(id => {
        if (!relationships[id]) {
          relationships[id] = 'pending';
        }
      });

      // incoming: demandes reçues non encore acceptées et pas déjà amis/pendings
      receivedPending.forEach(id => {
        if (!relationships[id]) {
          relationships[id] = 'incoming';
        }
      });

      return relationships;
    } catch (error) {
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

      // Accepter la demande reçue (contactId -> currentUser)
      const { error: updateError } = await supabase
        .from('contacts')
        .update({
          status: 'accepted',
          last_interaction: new Date().toISOString(),
        })
        .eq('user_id', contactId)
        .eq('contact_id', currentUser.id);

      if (updateError) throw updateError;

      // Créer/valider la relation inverse comme acceptée immédiatement (currentUser -> contactId)
      const { error: insertError } = await supabase
        .from('contacts')
        .upsert({
          user_id: currentUser.id,
          contact_id: contactId,
          status: 'accepted',
          last_interaction: new Date().toISOString(),
        });

      if (insertError) throw insertError;
    } catch (error) {
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
        .select('id, name, avatar, level, preferred_time, average_pace, gender')
        .neq('id', currentUser.id)
        .ilike('name', `%${query}%`)
        .limit(20);

      if (error) throw error;

      return (data || []).map((user: any) => ({
        id: user.id,
        name: user.name,
        avatar: user.avatar,
        lastActivity: 'Nouveau',
        level: user.level,
        preferredTime: user.preferred_time,
        averagePace: user.average_pace,
        gender: user.gender,
      }));
    } catch (error) {
      throw error;
    }
  }

  /**
   * Compte les demandes de contact envoyées ce mois-ci par l'utilisateur actuel
   * (utilisé pour la limite de 2 rencontres/mois en version gratuite)
   */
  static async getMonthlyContactRequestCount(): Promise<number> {
    try {
      const currentUser = await getCurrentUserFromDB();
      if (!currentUser) return 0;

      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { count, error } = await supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', currentUser.id)
        .gte('created_at', startOfMonth.toISOString());

      if (error) throw error;
      return count ?? 0;
    } catch (error) {
      if (__DEV__) console.error('Monthly contact count failed:', error);
      return 0;
    }
  }

  /**
   * Récupère les demandes de contact en attente
   */
  static async getPendingRequests(): Promise<{ incoming: ContactRequest[]; outgoing: ContactRequest[] }> {
    try {
      const currentUser = await getCurrentUserFromDB();
      if (!currentUser) {
        throw new Error('Utilisateur non authentifié');
      }

      const [incomingResult, outgoingResult] = await Promise.all([
        supabase
          .from('contacts')
          .select(`
            user_id,
            created_at,
            sender:users!contacts_user_id_fkey(id, name, avatar)
          `)
          .eq('contact_id', currentUser.id)
          .eq('status', 'pending'),
        supabase
          .from('contacts')
          .select(`
            contact_id,
            created_at,
            receiver:users!contacts_contact_id_fkey(id, name, avatar)
          `)
          .eq('user_id', currentUser.id)
          .eq('status', 'pending'),
      ]);

      if (incomingResult.error) throw incomingResult.error;
      if (outgoingResult.error) throw outgoingResult.error;

      let incoming: ContactRequest[] = (incomingResult.data || []).map((request: any) => ({
        id: request.sender.id,
        name: request.sender.name,
        avatar: request.sender.avatar,
        lastActivity: request.created_at
          ? this.formatLastActivity(request.created_at)
          : 'Demande en attente',
        type: 'incoming',
      }));

      let outgoing: ContactRequest[] = (outgoingResult.data || []).map((request: any) => ({
        id: request.receiver.id,
        name: request.receiver.name,
        avatar: request.receiver.avatar,
        lastActivity: request.created_at
          ? this.formatLastActivity(request.created_at)
          : 'En attente',
        type: 'outgoing',
      }));

      // Filtrer toute demande devenue "amis" entre temps
      const relationships = await this.getRelationshipsMap();
      incoming = incoming.filter(req => relationships[req.id] !== 'friends');
      outgoing = outgoing.filter(req => relationships[req.id] !== 'friends');

      return { incoming, outgoing };
    } catch (error: any) {
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

      const now = new Date().toISOString();

      // Mettre à jour la demande reçue (senderId -> currentUser)
      const { error: updateError, data: updateData } = await supabase
        .from('contacts')
        .update({
          status: 'accepted',
          last_interaction: now,
        })
        .eq('user_id', senderId)
        .eq('contact_id', currentUser.id)
        .select();

      if (updateError) {
        throw updateError;
      }

      // Vérifier si la relation inverse existe déjà
      const { data: existingRelation, error: checkError } = await supabase
        .from('contacts')
        .select('id, status')
        .eq('user_id', currentUser.id)
        .eq('contact_id', senderId)
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') {
        // PGRST116 = aucune ligne trouvée, ce qui est OK
        throw checkError;
      }

      // Si la relation existe déjà, la mettre à jour, sinon l'insérer
      if (existingRelation) {
        const { error: updateInverseError } = await supabase
          .from('contacts')
          .update({
            status: 'accepted',
            last_interaction: now,
          })
          .eq('user_id', currentUser.id)
          .eq('contact_id', senderId);

        if (updateInverseError) {
          throw updateInverseError;
        }
      } else {
        // Créer la relation inverse pour que les deux utilisateurs soient amis
        const { error: insertError } = await supabase
          .from('contacts')
          .insert({
            user_id: currentUser.id,
            contact_id: senderId,
            status: 'accepted',
            last_interaction: now,
          });

        if (insertError) {
          throw insertError;
        }
      }

      // Vérifier que les deux relations sont bien créées
      const { data: verifyData, error: verifyError } = await supabase
        .from('contacts')
        .select('id, status')
        .or(`and(user_id.eq.${currentUser.id},contact_id.eq.${senderId}),and(user_id.eq.${senderId},contact_id.eq.${currentUser.id})`)
        .eq('status', 'accepted');

      // Verification silenced
    } catch (error) {
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

      // Tenter d'abord la suppression via une fonction RPC (SECURITY DEFINER) côté DB si elle existe
      // Cette fonction doit supprimer les deux lignes (user_id -> contact_id) et (contact_id -> user_id)
      // Ex:
      // create or replace function delete_contact_pair(user_a_id uuid, user_b_id uuid)
      // returns void language plpgsql security definer as $$
      // begin
      //   delete from contacts where (user_id = user_a_id and contact_id = user_b_id)
      //                           or (user_id = user_b_id and contact_id = user_a_id);
      // end $$;
      try {
        await supabase.rpc('delete_contact_pair', {
          user_a_id: currentUser.id,
          user_b_id: contactId,
        });
      } catch (rpcError) {
        if (__DEV__) console.error('RPC delete_contact_pair failed:', rpcError);
        // Ignorer si la fonction n'existe pas, on passe à la suppression standard
      }

      // Supprimer la relation dans les deux sens
      const [{ error: error1 }, { error: error2 }] = await Promise.all([
        supabase
          .from('contacts')
          .delete()
          .eq('user_id', currentUser.id)
          .eq('contact_id', contactId),
        supabase
          .from('contacts')
          .delete()
          .eq('user_id', contactId)
          .eq('contact_id', currentUser.id),
      ]);

      if (error1) throw error1;
      if (error2) throw error2;

      // Nettoyer la conversation et messages entre les deux utilisateurs
      const [id1, id2] = currentUser.id < contactId
        ? [currentUser.id, contactId]
        : [contactId, currentUser.id];

      // Récupérer la conversation si elle existe
      const { data: existingConv } = await supabase
        .from('conversations')
        .select('id')
        .eq('user1_id', id1)
        .eq('user2_id', id2)
        .single();

      if (existingConv?.id) {
        // Supprimer d'abord les messages liés (pas de cascade dans le schéma)
        await supabase
          .from('chat_messages')
          .delete()
          .eq('conversation_id', existingConv.id);

        // Supprimer la conversation
        await supabase
          .from('conversations')
          .delete()
          .eq('id', existingConv.id);
      }
    } catch (error) {
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