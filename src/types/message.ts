export interface Message {
  id: string;
  contactId: string;
  contactName: string;
  lastMessage: string;
  time: string;
}

export interface ChatMessage {
  id: string;
  content: string;
  senderId: string;
  time: string;
}