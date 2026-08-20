import { useEffect, useState } from 'react';
import Sidebar from '../components/layout/Sidebar';
import ChatWindow from '../components/chat/ChatWindow';
import { useChatStore } from '../store/chatStore';
import { useAuthStore } from '../store/authStore';
import { getPrivateKey, savePrivateKey } from '../crypto/keyStorage';
import { generateIdentityKeyPair, bytesToHex } from '../crypto/keyExchange';

export default function ChatPage() {
  const { fetchConversations, connectWebSocket } = useChatStore();
  const user = useAuthStore(state => state.user);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function initClient() {
      if (!user) return;
      
      try {
        let privateKey = await getPrivateKey(user.id);
        let publicKeyHex = '';

        if (!privateKey) {
          const { privateKey: newPriv, publicKey: newPub } = generateIdentityKeyPair();
          await savePrivateKey(user.id, newPriv);
          privateKey = newPriv;
          publicKeyHex = bytesToHex(newPub);
        } else {
          const { x25519 } = await import('@noble/curves/ed25519.js');
          publicKeyHex = bytesToHex(x25519.getPublicKey(privateKey));
        }

        await fetch('/api/users/keys', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ publicKey: publicKeyHex })
        });

        await fetchConversations();
        connectWebSocket();
        setIsReady(true);
      } catch (error) {
        console.error("Failed to initialize cryptographic client", error);
      }
    }
    
    initClient();

    // 🚀 PERMANENT FIX: Silent Background Sync
    // This checks for new public keys every 3 seconds. 
    // If Toni's key changes, Harsh's app will auto-heal instantly without a refresh.
    const syncInterval = setInterval(() => {
      fetchConversations();
    }, 3000);

    return () => clearInterval(syncInterval);

  }, [user, fetchConversations, connectWebSocket]);

  if (!isReady) {
    return (
      <div className="h-screen w-screen bg-background text-primary flex items-center justify-center">
        Unlocking secure context & syncing keys...
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-background flex overflow-hidden text-gray-200 font-sans">
      <Sidebar />
      <ChatWindow />
    </div>
  );
}