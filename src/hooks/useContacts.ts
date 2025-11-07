import { useState, useEffect } from 'react';
import { Contact, ContactRelationshipStatus } from '../types/contact';
import { ContactsService } from '../services/ContactsService';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../config/supabase';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

type AddContactResult =
  | { success: true }
  | { success: false; reason: 'already_friends' | 'already_sent' | 'incoming_request' | 'blocked' | 'unknown' };

export function useContacts() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [relationships, setRelationships] = useState<Record<string, ContactRelationshipStatus>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, isSkipped } = useAuth();

  useEffect(() => {
    loadContacts();
  }, [user, isSkipped]);

  // Realtime subscription pour les changements dans la table contacts
  useEffect(() => {
    if (!user) return;

    console.log('🔴 Setting up realtime subscription for contacts');

    const channel = supabase
      .channel('contacts-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'contacts',
          filter: `user_id=eq.${user.id}`,
        },
        async (payload: RealtimePostgresChangesPayload<any>) => {
          console.log('🔴 Received realtime event:', payload.eventType, payload);

          // Rafraîchir les contacts et relations après tout changement
          try {
            const [contactsData, relationshipsMap] = await Promise.all([
              ContactsService.getContacts(),
              ContactsService.getRelationshipsMap(),
            ]);
            setContacts(contactsData);
            setRelationships(relationshipsMap);
          } catch (error) {
            console.error('Error refreshing after realtime event:', error);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'contacts',
          filter: `contact_id=eq.${user.id}`,
        },
        async (payload: RealtimePostgresChangesPayload<any>) => {
          console.log('🔴 Received realtime event (as contact):', payload.eventType, payload);

          // Rafraîchir les contacts et relations après tout changement
          try {
            const [contactsData, relationshipsMap] = await Promise.all([
              ContactsService.getContacts(),
              ContactsService.getRelationshipsMap(),
            ]);
            setContacts(contactsData);
            setRelationships(relationshipsMap);
          } catch (error) {
            console.error('Error refreshing after realtime event:', error);
          }
        }
      )
      .subscribe((status) => {
        console.log('🔴 Subscription status:', status);
      });

    return () => {
      console.log('🔴 Cleaning up realtime subscription');
      supabase.removeChannel(channel);
    };
  }, [user]);

  const loadContacts = async () => {
    // Si l'utilisateur n'est pas authentifié et n'a pas choisi de continuer sans compte
    if (!user && !isSkipped) {
      setLoading(false);
      setContacts([]);
      return;
    }

    // Si l'utilisateur a choisi de continuer sans compte
    if (isSkipped && !user) {
      setLoading(false);
      setContacts([]);
      return;
    }

    try {
      setLoading(true);
      const [contactsData, relationshipsMap] = await Promise.all([
        ContactsService.getContacts(),
        ContactsService.getRelationshipsMap(),
      ]);

      setContacts(contactsData);
      setRelationships(relationshipsMap);
      setError(null);
    } catch (err: any) {
      // Gérer silencieusement les erreurs d'authentification
      if (err?.message?.includes('Utilisateur non authentifié')) {
        setContacts([]);
        setRelationships({});
        setError(null);
      } else {
        setError('Erreur lors du chargement des contacts');
        // Ne pas logger les erreurs d'authentification
        if (!err?.message?.includes('Utilisateur non authentifié')) {
          console.error('Error loading contacts:', err);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const addContact = async (runnerId: string): Promise<AddContactResult> => {
    try {
      await ContactsService.addContact(runnerId);
      setRelationships(prev => ({ ...prev, [runnerId]: 'pending' }));
      return { success: true };
    } catch (err: any) {
      if (err instanceof Error) {
        switch (err.message) {
          case 'ALREADY_FRIENDS':
            setRelationships(prev => ({ ...prev, [runnerId]: 'friends' }));
            return { success: false, reason: 'already_friends' };
          case 'REQUEST_ALREADY_SENT':
            setRelationships(prev => ({ ...prev, [runnerId]: 'pending' }));
            return { success: false, reason: 'already_sent' };
          case 'REQUEST_PENDING_FROM_CONTACT':
            setRelationships(prev => ({ ...prev, [runnerId]: 'incoming' }));
            return { success: false, reason: 'incoming_request' };
          case 'CONTACT_BLOCKED':
            return { success: false, reason: 'blocked' };
          default:
            break;
        }
      }

      console.error('Error adding contact:', err);
      return { success: false, reason: 'unknown' };
    }
  };

  const removeContact = async (contactId: string) => {
    try {
      await ContactsService.removeContact(contactId);
      setContacts(prev => prev.filter(contact => contact.id !== contactId));
      setRelationships(prev => {
        const updated = { ...prev };
        delete updated[contactId];
        return updated;
      });
      return true;
    } catch (error) {
      console.error('Error removing contact:', error);
      return false;
    }
  };

  return {
    contacts,
    relationships,
    loading,
    error,
    addContact,
    removeContact,
    refreshContacts: loadContacts,
    refetch: loadContacts,
  };
}