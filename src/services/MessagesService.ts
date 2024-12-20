import { Message, ChatMessage } from '../types/message';

const MOCK_MESSAGES: Message[] = [
  {
    id: '1',
    contactId: '1',
    contactName: 'Marie L.',
    lastMessage: 'On court ensemble demain ?',
    time: '10:30',
  },
  {
    id: '2',
    contactId: '2',
    contactName: 'Thomas R.',
    lastMessage: 'Super course aujourd\'hui !',
    time: '09:15',
  },
];

const MOCK_CHAT_MESSAGES: ChatMessage[] = [
  {
    id: '1',
    content: 'Salut ! Tu cours demain ?',
    senderId: 'other',
    time: '10:30',
  },
  {
    id: '2',
    content: 'Oui, je pensais y aller vers 9h',
    senderId: 'currentUser',
    time: '10:31',
  },
];

export class MessagesService {
  static async getMessages(): Promise<Message[]> {
    return new Promise((resolve) => {
      setTimeout(() => resolve(MOCK_MESSAGES), 1000);
    });
  }

  static async getChatMessages(contactId: string): Promise<ChatMessage[]> {
    return new Promise((resolve) => {
      setTimeout(() => resolve(MOCK_CHAT_MESSAGES), 1000);
    });
  }

  static async sendMessage(contactId: string, content: string): Promise<ChatMessage> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          id: Date.now().toString(),
          content,
          senderId: 'currentUser',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        });
      }, 500);
    });
  }
}