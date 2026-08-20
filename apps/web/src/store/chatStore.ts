import { create } from 'zustand';
import { Conversation, Message } from '../types/chat';
import { encryptMessage } from '../crypto/encryption';
import { getPrivateKey } from '../crypto/keyStorage';
import { computeSharedSecret, hexToBytes } from '../crypto/keyExchange';
import { deriveMessageKey } from '../crypto/keyDerivation';

interface ChatState {
  conversations: Conversation[];
  activeConversation: Conversation | null;
  messages: Message[];
  ws: WebSocket | null;
  
  fetchConversations: () => Promise<void>;
  setActiveConversation: (convo: Conversation) => void;
  fetchMessages: (conversationId: string) => Promise<void>;
  connectWebSocket: () => void;
  sendMessage: (plaintext: string, senderId: string) => Promise<void>;
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  activeConversation: null,
  messages: [],
  ws: null,

  fetchConversations: async () => {
    const res = await fetch('/api/conversations');
    if (res.ok) {
      const data = await res.json();
      
      set((state) => {
        // PERMANENT FIX: Find if our currently open chat has new keys in the database
        const updatedActive = state.activeConversation 
          ? data.conversations.find((c: Conversation) => c.id === state.activeConversation!.id) 
          : null;
          
        return { 
          conversations: data.conversations,
          // If keys changed, seamlessly update the active chat without reloading
          ...(updatedActive && { activeConversation: updatedActive })
        };
      });
    }
  },

  setActiveConversation: (convo) => {
    set({ activeConversation: convo, messages: [] });
    get().fetchMessages(convo.id);
  },

  fetchMessages: async (conversationId) => {
    const res = await fetch(`/api/messages/${conversationId}`);
    if (res.ok) {
      const data = await res.json();
      set({ messages: data.messages });
    }
  },

  connectWebSocket: () => {
    if (get().ws) return; // Already connected
    const ws = new WebSocket('ws://localhost:3001/ws');
    
    ws.onmessage = (event) => {
      const payload = JSON.parse(event.data);
      if (payload.type === 'message:receive') {
        const newMessage = payload.data;
        const state = get();
        if (state.activeConversation?.id === newMessage.conversationId) {
          set({ messages: [...state.messages, newMessage] });
        }
        // Re-fetch conversations to update timestamps
        state.fetchConversations();
      }
    };

    set({ ws });
  },

  sendMessage: async (plaintext, senderId) => {
    const state = get();
    const activeConvo = state.activeConversation;
    if (!activeConvo || !state.ws) return;

    // 1. Find recipient's public key
    const recipient = activeConvo.members.find(m => m.userId !== senderId);
    if (!recipient || !recipient.user.identityKey) {
      console.error("Recipient public key not found");
      return;
    }

    // 2. Cryptographic operations
    const privateKey = await getPrivateKey(senderId);
    if (!privateKey) return;

    const sharedSecret = computeSharedSecret(privateKey, hexToBytes(recipient.user.identityKey.publicKey));
    const aesKey = await deriveMessageKey(sharedSecret);
    
    // 3. Encrypt payload
    const { ciphertext, nonce } = await encryptMessage(plaintext, aesKey);

    // 4. Send over WS
    state.ws.send(JSON.stringify({
      type: 'message:send',
      data: {
        conversationId: activeConvo.id,
        ciphertext,
        nonce
      }
    }));
  }
}));