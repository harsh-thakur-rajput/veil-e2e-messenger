import { useEffect, useState } from 'react';
import { useChatStore } from '../../store/chatStore';
import { useAuthStore } from '../../store/authStore';
import { User } from '../../types/chat';

export default function Sidebar() {
  const { conversations, activeConversation, setActiveConversation, fetchConversations } = useChatStore();
  const user = useAuthStore(state => state.user);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);

  useEffect(() => {
    fetch('/api/users')
      .then(res => res.json())
      .then(data => {
        if (data.success) setAvailableUsers(data.users);
      });
  }, []);

  const startNewChat = async (targetUserId: string) => {
    const res = await fetch('/api/conversations/direct', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetUserId })
    });
    if (res.ok) {
      const data = await res.json();
      await fetchConversations();
      setActiveConversation(data.conversation);
    }
  };

  return (
    <div className="w-80 bg-surface border-r border-gray-800 flex flex-col h-full">
      <div className="p-4 border-b border-gray-800 bg-background/50">
        <h2 className="text-xl font-bold tracking-widest text-white">VEIL</h2>
        <p className="text-xs text-gray-400 mt-1">Logged in as <span className="text-primary font-semibold">{user?.username}</span></p>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2 space-y-4">
        {/* Active Conversations */}
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2 mt-2">Chats</h3>
          {conversations.map((convo) => {
            const otherMember = convo.members.find(m => m.userId !== user?.id);
            const isActive = activeConversation?.id === convo.id;
            
            return (
              <div 
                key={convo.id}
                onClick={() => setActiveConversation(convo)}
                className={`p-3 rounded-lg cursor-pointer transition-colors flex items-center space-x-3
                  ${isActive ? 'bg-primary/20 border border-primary/30' : 'hover:bg-gray-800 border border-transparent'}`}
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-white font-bold">
                  {otherMember?.user.username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-gray-200">{otherMember?.user.username}</p>
                  <p className="text-xs text-accent">🔐 E2E Encrypted</p>
                </div>
              </div>
            );
          })}
          {conversations.length === 0 && <p className="text-gray-600 text-sm px-2">No active chats.</p>}
        </div>

        {/* Start New Chat */}
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2 mt-4 border-t border-gray-800 pt-4">Available Users</h3>
          {availableUsers.map((u) => (
            <div 
              key={u.id}
              onClick={() => startNewChat(u.id)}
              className="p-3 rounded-lg cursor-pointer hover:bg-gray-800 transition-colors flex items-center space-x-3"
            >
              <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-white font-bold text-sm">
                {u.username.charAt(0).toUpperCase()}
              </div>
              <p className="font-medium text-gray-300">{u.username}</p>
            </div>
          ))}
          {availableUsers.length === 0 && <p className="text-gray-600 text-sm px-2">Waiting for others to join...</p>}
        </div>
      </div>
    </div>
  );
}