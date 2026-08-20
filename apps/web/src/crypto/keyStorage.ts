const PRIVATE_KEY_STORE = 'veil_identity_private_key';

export async function savePrivateKey(userId: string, privateKey: Uint8Array): Promise<void> {
  const hex = Array.from(privateKey).map(b => b.toString(16).padStart(2, '0')).join('');
  localStorage.setItem(`${PRIVATE_KEY_STORE}_${userId}`, hex);
}

export async function getPrivateKey(userId: string): Promise<Uint8Array | undefined> {
  const hex = localStorage.getItem(`${PRIVATE_KEY_STORE}_${userId}`);
  if (!hex) return undefined;
  
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}