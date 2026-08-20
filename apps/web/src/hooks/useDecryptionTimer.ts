import { useState, useEffect, useCallback } from 'react';

// We now pass `onLock` so the timer can wipe the plaintext when it finishes
export function useDecryptionTimer(onLock: () => void, durationSeconds: number = 10) {
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  const startTimer = useCallback(() => {
    setTimeLeft(durationSeconds);
  }, [durationSeconds]);

  useEffect(() => {
    if (timeLeft === null) return;
    
    // When timer hits 0, trigger the lock and reset the timer
    if (timeLeft <= 0) {
      onLock(); 
      setTimeLeft(null);
      return;
    }

    const timerId = setTimeout(() => {
      setTimeLeft((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => clearTimeout(timerId);
  }, [timeLeft, onLock]);

  return { timeLeft, startTimer };
}