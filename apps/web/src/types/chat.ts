export interface IdentityKey {
  id: string;
  publicKey: string;
}

export interface User {
  id: string;
  username: string;
  identityKey?: IdentityKey;
}

export interface ConversationMember {
  userId: string;
  user: User;
}

export interface Conversation {
  id: string;
  isGroup: boolean;
  members: ConversationMember[];
  updatedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  ciphertext: string;
  nonce: string;
  createdAt: string;
}