// Generate a cryptographically secure random 12-byte initialization vector (nonce)
export function generateNonce(): Uint8Array {
  const nonce = new Uint8Array(new ArrayBuffer(12));
  window.crypto.getRandomValues(nonce);
  return nonce;
}

// Helper: Convert ArrayBuffer to Base64 String
export function arrayBufferToBase64(buffer: ArrayBufferLike): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Helper: Convert Base64 String to Uint8Array
export function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(new ArrayBuffer(binaryString.length));
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Encrypt a plaintext string
export async function encryptMessage(
  plaintext: string,
  key: CryptoKey
): Promise<{ ciphertext: string; nonce: string }> {
  const encoder = new TextEncoder();
  const encodedText = encoder.encode(plaintext);
  const nonce = generateNonce();

  const ciphertextBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: nonce as unknown as BufferSource,
    },
    key,
    encodedText as unknown as BufferSource
  );

  return {
    ciphertext: arrayBufferToBase64(ciphertextBuffer),
    nonce: arrayBufferToBase64(nonce.buffer),
  };
}

// Decrypt a ciphertext string back to plaintext
export async function decryptMessage(
  ciphertextBase64: string,
  nonceBase64: string,
  key: CryptoKey
): Promise<string> {
  const ciphertextBuffer = base64ToUint8Array(ciphertextBase64);
  const nonce = base64ToUint8Array(nonceBase64);

  const decryptedBuffer = await window.crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: nonce as unknown as BufferSource,
    },
    key,
    ciphertextBuffer as unknown as BufferSource
  );

  const decoder = new TextDecoder();
  return decoder.decode(decryptedBuffer);
}