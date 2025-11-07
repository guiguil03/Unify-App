export type ContactRelationshipStatus = 'friends' | 'pending' | 'incoming';

export interface Contact {
  id: string;
  name: string;
  lastActivity: string;
  avatar?: string;
}

export interface ContactRequest extends Contact {
  type: 'incoming' | 'outgoing';
  message?: string;
}