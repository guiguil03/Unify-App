import { useState, useEffect } from 'react';
import { Contact } from '../types/contact';
import { ContactsService } from '../services/ContactsService';
import { useAuth } from '../contexts/AuthContext';

export function useContacts() {
  const [contacts, setContacts] = useState<Contact[]>([]);
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
      const data = await ContactsService.getContacts();
      setContacts(data);
      setError(null);
    } catch (err: any) {
      // Gérer silencieusement les erreurs d'authentification
      if (err?.message?.includes('Utilisateur non authentifié')) {
        setContacts([]);
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

  const addContact = async (runnerId: string) => {
    try {
      const newContact = await ContactsService.addContact(runnerId);
      setContacts(prev => [...prev, newContact]);
      return true;
    } catch (err) {
      console.error('Error adding contact:', err);
      return false;
    }
  };

  return {
    contacts,
    loading,
    error,
    addContact,
    refreshContacts: loadContacts,
    refetch: loadContacts,
  };
}