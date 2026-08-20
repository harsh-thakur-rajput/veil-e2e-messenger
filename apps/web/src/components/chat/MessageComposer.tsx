import { useState } from 'react';
import { useChatStore } from '../../store/chatStore';
import { useAuthStore } from '../../store/authStore';
import { SendHorizontal } from 'lucide-react';

export default function MessageComposer() {
  const [text, setText] = useState('');
  const sendMessage = useChatStore(state => state.sendMessage);
  const user = useAuthStore(state => state.user);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !user) return;
    
    await sendMessage(text.trim(), user.id);
    setText('');
  };

  return (
    <div className="p-4 bg-surface border-t border-gray-800">
      <form onSubmit={handleSend} className="flex space-x-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type an encrypted message..."
          className="flex-1 bg-background border border-gray-700 rounded-full px-4 py-2 text-white focus:outline-none focus:border-primary transition-colors"
        />
        <button 
          type="submit"
          disabled={!text.trim()}
          className="bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:hover:bg-primary text-white w-10 h-10 rounded-full flex items-center justify-center transition-colors"
        >
          <SendHorizontal size={20} />
        </button>
      </form>
    </div>
  );
}