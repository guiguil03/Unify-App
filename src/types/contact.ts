export type ContactRelationshipStatus = 'friends' | 'pending' | 'incoming';

export interface Contact {
  id: string;
  name: string;
  lastActivity: string;
  avatar?: string;
  level?: string;
  preferredTime?: string;
  averagePace?: string;
  gender?: string;
}

export interface ContactRequest extends Contact {
  type: 'incoming' | 'outgoing';
  message?: string;
}
