import { Contact } from '../types/contact';

const MOCK_CONTACTS: Contact[] = [
  {
    id: '1',
    name: 'Marie L.',
    lastActivity: 'Il y a 2h',
    avatar: 'https://via.placeholder.com/100',
  },
  {
    id: '2',
    name: 'Thomas R.',
    lastActivity: 'Il y a 1j',
    avatar: 'https://via.placeholder.com/100',
  },
];

export class ContactsService {
  static async getContacts(): Promise<Contact[]> {
    // Simuler un appel API
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(MOCK_CONTACTS);
      }, 1000);
    });
  }

  static async addContact(runnerId: string): Promise<Contact> {
    // Simuler l'ajout d'un contact
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          id: runnerId,
          name: 'Nouveau contact',
          lastActivity: 'À l\'instant',
          avatar: 'https://via.placeholder.com/100',
        });
      }, 500);
    });
  }
}