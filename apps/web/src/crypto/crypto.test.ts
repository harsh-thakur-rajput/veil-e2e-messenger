import { describe, it, expect, beforeAll } from 'vitest';
import { generateIdentityKeyPair, computeSharedSecret, bytesToHex } from './keyExchange';
import { deriveMessageKey } from './keyDerivation';
import { encryptMessage, decryptMessage } from './encryption';

// Polyfill the browser's window.crypto API for the Node.js test environment
beforeAll(() => {
  if (typeof window === 'undefined') {
    (globalThis as any).window = {};
  }
  (globalThis as any).window.crypto = globalThis.crypto;
});

describe('VEIL Cryptographic Engine', () => {
  it('should generate valid X25519 key pairs', () => {
    const alice = generateIdentityKeyPair();
    expect(alice.privateKey).toBeDefined();
    expect(alice.publicKey).toBeDefined();
    expect(alice.privateKey.length).toBe(32);
    expect(alice.publicKey.length).toBe(32);
  });

  it('should compute the exact same shared secret for both parties', () => {
    const alice = generateIdentityKeyPair();
    const bob = generateIdentityKeyPair();

    // Alice uses her private key and Bob's public key
    const aliceSecret = computeSharedSecret(alice.privateKey, bob.publicKey);
    
    // Bob uses his private key and Alice's public key
    const bobSecret = computeSharedSecret(bob.privateKey, alice.publicKey);

    // The math must match perfectly
    expect(bytesToHex(aliceSecret)).toBe(bytesToHex(bobSecret));
  });

  it('should successfully encrypt and decrypt a message', async () => {
    const alice = generateIdentityKeyPair();
    const bob = generateIdentityKeyPair();

    const sharedSecret = computeSharedSecret(alice.privateKey, bob.publicKey);
    const aesKey = await deriveMessageKey(sharedSecret);

    const plaintext = "This is a highly classified message.";
    
    // Encrypt
    const { ciphertext, nonce } = await encryptMessage(plaintext, aesKey);
    expect(ciphertext).not.toBe(plaintext); // Must be scrambled

    // Decrypt
    const decrypted = await decryptMessage(ciphertext, nonce, aesKey);
    expect(decrypted).toBe(plaintext); // Must match original
  });

  it('should fail to decrypt if ciphertext is tampered with', async () => {
    const alice = generateIdentityKeyPair();
    const bob = generateIdentityKeyPair();

    const sharedSecret = computeSharedSecret(alice.privateKey, bob.publicKey);
    const aesKey = await deriveMessageKey(sharedSecret);

    const { ciphertext, nonce } = await encryptMessage("Secret Data", aesKey);

    // Tamper with the ciphertext (change the first character)
    const tamperedCiphertext = ciphertext.substring(1) + 'A';

    // It should throw an error because AES-GCM checks authentication tags
    await expect(decryptMessage(tamperedCiphertext, nonce, aesKey)).rejects.toThrow();
  });

  it('should fail to decrypt using the wrong key', async () => {
    const alice = generateIdentityKeyPair();
    const bob = generateIdentityKeyPair();
    const eve = generateIdentityKeyPair(); // Attacker

    const validSecret = computeSharedSecret(alice.privateKey, bob.publicKey);
    const validAesKey = await deriveMessageKey(validSecret);

    // Eve tries to guess the key
    const eveSecret = computeSharedSecret(eve.privateKey, bob.publicKey);
    const eveAesKey = await deriveMessageKey(eveSecret);

    const { ciphertext, nonce } = await encryptMessage("Secret Data", validAesKey);

    // Eve attempting to decrypt must fail
    await expect(decryptMessage(ciphertext, nonce, eveAesKey)).rejects.toThrow();
  });
});