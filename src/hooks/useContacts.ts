import { useState, useEffect } from 'react';
import { Contact } from '../types/contact';
import { ContactsService } from '../services/ContactsService';

export function useContacts() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    try {
      setLoading(true);
      const data = await ContactsService.getContacts();
      setContacts(data);
      setError(null);
    } catch (err) {
      setError('Erreur lors du chargement des contacts');
      console.error('Error loading contacts:', err);
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
  };
}