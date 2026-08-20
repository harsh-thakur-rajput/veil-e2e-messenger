import { useEffect, useRef, useState } from 'react';
import { useChatStore } from '../../store/chatStore';
import { useAuthStore } from '../../store/authStore';
import { getPrivateKey } from '../../crypto/keyStorage';
import { computeSharedSecret, hexToBytes } from '../../crypto/keyExchange';
import { deriveMessageKey } from '../../crypto/keyDerivation';
import MessageBubble from './MessageBubble';
import MessageComposer from './MessageComposer';

export default function ChatWindow() {
  const { activeConversation, messages } = useChatStore();
  const user = useAuthStore(state => state.user);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [aesKey, setAesKey] = useState<CryptoKey | null>(null);

  // Derive AES key when conversation changes
  useEffect(() => {
    async function setupConversationKey() {
      if (!activeConversation || !user) return;
      
      const otherMember = activeConversation.members.find(m => m.userId !== user.id);
      if (!otherMember?.user.identityKey) return;

      const privateKey = await getPrivateKey(user.id);
      if (!privateKey) return;

      try {
        const sharedSecret = computeSharedSecret(privateKey, hexToBytes(otherMember.user.identityKey.publicKey));
        const key = await deriveMessageKey(sharedSecret);
        setAesKey(key);
      } catch (err) {
        console.error("Failed to derive chat key");
      }
    }
    
    setAesKey(null); // Reset key on chat switch
    setupConversationKey();
  }, [activeConversation, user]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  if (!activeConversation) {
    return (
      <div className="flex-1 bg-background flex flex-col items-center justify-center text-gray-500">
        <div className="w-16 h-16 rounded-full bg-surface border border-gray-800 flex items-center justify-center mb-4">
          <span className="text-2xl opacity-50">🔐</span>
        </div>
        <p>Select a conversation to start messaging securely.</p>
      </div>
    );
  }

  const otherMember = activeConversation.members.find(m => m.userId !== user?.id);

  return (
    <div className="flex-1 flex flex-col bg-background h-full">
      {/* Header */}
      <div className="h-16 border-b border-gray-800 bg-surface/50 flex items-center px-6 shadow-sm justify-between">
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-white font-bold mr-3">
            {otherMember?.user.username.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="font-semibold text-gray-200">{otherMember?.user.username}</h3>
            <p className="text-xs text-accent">E2E Session Active</p>
          </div>
        </div>
        {aesKey === null ? (
          <span className="text-xs text-red-400 bg-red-400/10 px-2 py-1 rounded">Negotiating Keys...</span>
        ) : (
          <span className="text-xs text-green-400 bg-green-400/10 px-2 py-1 rounded">Keys Secured</span>
        )}
      </div>

      {/* Messages Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 scroll-smooth">
        {messages.map((msg) => (
          <MessageBubble 
            key={msg.id} 
            message={msg} 
            isOwn={msg.senderId === user?.id} 
            aesKey={aesKey}
          />
        ))}
        {messages.length === 0 && (
          <p className="text-center text-gray-500 text-sm mt-10">
            Messages are visible. Their meaning isn't.<br/>Start typing to send a secure message.
          </p>
        )}
      </div>

      <MessageComposer />
    </div>
  );
}