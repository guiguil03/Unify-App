import { useState, useEffect } from 'react';
import { Contact, ContactRelationshipStatus } from '../types/contact';
import { ContactsService } from '../services/ContactsService';
import { useAuth } from '../contexts/AuthContext';

type AddContactResult =
  | { success: true; autoAccepted?: boolean }
  | { success: false; reason: 'already_friends' | 'already_sent' | 'incoming_request' | 'blocked' | 'monthly_limit_reached' | 'unknown' };

export function useContacts() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [relationships, setRelationships] = useState<Record<string, ContactRelationshipStatus>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, isSkipped } = useAuth();

  useEffect(() => {
    loadContacts();
  }, [user, isSkipped]);

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
      if (__DEV__) console.error('Contacts load failed:', err);
      // Gérer silencieusement les erreurs d'authentification
      if (err?.message?.includes('Utilisateur non authentifié')) {
        setContacts([]);
        setRelationships({});
        setError(null);
      } else {
        setError('Erreur lors du chargement des contacts');
      }
    } finally {
      setLoading(false);
    }
  };

  const addContact = async (runnerId: string, isPremium = false): Promise<AddContactResult> => {
    try {
      // Vérifier la limite mensuelle pour les utilisateurs gratuits
      if (!isPremium) {
        const monthlyCount = await ContactsService.getMonthlyContactRequestCount();
        if (monthlyCount >= 2) {
          return { success: false, reason: 'monthly_limit_reached' };
        }
      }

      // Mettre à jour optimistiquement le statut pour un feedback immédiat
      setRelationships(prev => ({ ...prev, [runnerId]: 'pending' }));

      await ContactsService.addContact(runnerId);
      
      // Vérifier rapidement le statut réel de la relation après l'ajout
      // (peut être 'friends' si une demande entrante a été acceptée automatiquement)
      // On fait ça en parallèle pour ne pas bloquer l'UI
      const relationshipsMap = await ContactsService.getRelationshipsMap();
      const relationshipStatus = relationshipsMap[runnerId] || 'pending';
      
      setRelationships(prev => ({ ...prev, [runnerId]: relationshipStatus }));
      
      // Si la relation est maintenant 'friends', c'est qu'une demande a été acceptée automatiquement
      if (relationshipStatus === 'friends') {
        return { success: true, autoAccepted: true };
      }
      
      return { success: true };
    } catch (err: any) {
      // Revenir au statut précédent en cas d'erreur
      setRelationships(prev => {
        const updated = { ...prev };
        delete updated[runnerId];
        return updated;
      });
      
      if (err instanceof Error) {
        switch (err.message) {
          case 'ALREADY_FRIENDS':
            setRelationships(prev => ({ ...prev, [runnerId]: 'friends' }));
            return { success: false, reason: 'already_friends' };
          case 'REQUEST_ALREADY_SENT':
            setRelationships(prev => ({ ...prev, [runnerId]: 'pending' }));
            return { success: false, reason: 'already_sent' };
          case 'CONTACT_BLOCKED':
            return { success: false, reason: 'blocked' };
          default:
            break;
        }
      }

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
      if (__DEV__) console.error('Contact remove failed:', error);
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