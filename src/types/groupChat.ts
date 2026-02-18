export interface GroupChatPreview {
  id: string;
  name: string;
  lastMessage: string;
  time: string;
  memberCount: number;
  memberAvatars: (string | null)[];
}

export interface GroupMessage {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  senderAvatar: string | null;
  time: string;
}

export interface GroupMember {
  id: string;
  name: string;
  avatar: string | null;
  role: 'admin' | 'member';
}
