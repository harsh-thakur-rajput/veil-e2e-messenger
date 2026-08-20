export async function deriveMessageKey(sharedSecret: Uint8Array): Promise<CryptoKey> {
  // Import the raw shared secret into the Web Crypto API
  // Copy into a definite ArrayBuffer because Uint8Array may be backed by SharedArrayBuffer.
  const secretBuffer = new ArrayBuffer(sharedSecret.byteLength);
  new Uint8Array(secretBuffer).set(sharedSecret);

  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    secretBuffer,
    { name: 'HKDF' },
    false,
    ['deriveKey']
  );

  // Derive the AES-GCM key
  return await window.crypto.subtle.deriveKey(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: new Uint8Array(32), // Standard static salt for our baseline implementation
      info: new TextEncoder().encode('veil-message-key'),
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false, // false = The key material CANNOT be extracted/exported from memory
    ['encrypt', 'decrypt']
  );
}