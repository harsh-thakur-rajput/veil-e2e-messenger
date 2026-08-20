import { useState, useEffect } from 'react';
import { Message } from '../../types/chat';
import { Lock, Unlock } from 'lucide-react';
import { decryptMessage } from '../../crypto/encryption';
import { useVisibilityLock } from '../../hooks/useVisibilityLock';

interface Props {
  message: Message;
  isOwn: boolean;
  aesKey: CryptoKey | null;
}

export default function MessageBubble({ message, isOwn, aesKey }: Props) {
  const [plaintext, setPlaintext] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Instantly lock and wipe plaintext from memory
  const secureLock = () => {
    setPlaintext(null);
    setTimeLeft(null);
    setError(null);
  };

  useVisibilityLock(secureLock);

  // Pure React Timer - Bulletproof
  useEffect(() => {
    if (timeLeft === null) return;
    
    if (timeLeft <= 0) {
      secureLock();
      return;
    }

    const timerId = setTimeout(() => {
      setTimeLeft(timeLeft - 1);
    }, 1000);

    return () => clearTimeout(timerId);
  }, [timeLeft]);

  const handleUnlock = async () => {
    if (!aesKey) return;
    if (plaintext !== null) {
      secureLock(); // Lock manually on second click
      return;
    }

    try {
      setError(null);
      const decrypted = await decryptMessage(message.ciphertext, message.nonce, aesKey);
      setPlaintext(decrypted);
      setTimeLeft(10); // Start 10 second countdown
    } catch (err) {
      setError('Decryption failed. Data tampered.');
    }
  };

  const isUnlocked = plaintext !== null;

  return (
    <div className={`flex w-full mb-4 ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div 
        onClick={handleUnlock}
        className={`max-w-[75%] rounded-2xl px-4 py-3 shadow-sm cursor-pointer transition-all duration-300
          ${isOwn ? 'rounded-br-none' : 'rounded-bl-none'}
          ${isUnlocked ? 'bg-green-900/40 border border-green-500/30 text-green-100' : 
            isOwn ? 'bg-primary/90 text-white' : 'bg-surface border border-gray-800 text-gray-300'
          }`}
      >
        <div className="flex items-start space-x-2">
          {isUnlocked ? (
            <Unlock size={16} className="mt-0.5 flex-shrink-0 text-green-400" />
          ) : (
            <Lock size={16} className={`mt-0.5 flex-shrink-0 ${isOwn ? 'text-white/70' : 'text-accent'}`} />
          )}
          
          <div className="overflow-hidden w-full">
            {error ? (
              <p className="text-sm text-red-400">{error}</p>
            ) : isUnlocked ? (
              <div className="animate-in fade-in zoom-in-95 duration-200">
                <p className="text-sm break-words leading-relaxed">{plaintext}</p>
                <div className="mt-2 text-[10px] font-mono text-green-400/70 flex justify-between">
                  <span>Re-locking in {timeLeft}s</span>
                </div>
              </div>
            ) : (
              <p className="font-mono text-sm break-all truncate w-48 opacity-80 select-none">
                {message.ciphertext}
              </p>
            )}
            
            {!isUnlocked && (
              <p className={`text-[10px] mt-1 text-right ${isOwn ? 'text-white/60' : 'text-gray-500'}`}>
                {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}