# VEIL - Cryptographic Design

## Primitives
- **Asymmetric Key Agreement:** X25519 (via `@noble/curves/ed25519`).
- **Key Derivation Function (KDF):** HKDF-SHA256 (Web Crypto API).
- **Symmetric Encryption:** AES-256-GCM (Web Crypto API).
- **Password Hashing:** Argon2id (Server-side).

## Identity & Keys
1. Upon registration, the client generates an X25519 Key Pair (`Priv_U`, `Pub_U`).
2. `Priv_U` remains exclusively on the client device.
3. `Pub_U` is uploaded to the server's public key directory.

## Encryption Flow (User A to User B)
1. **Key Agreement:** User A retrieves `Pub_B` from the server.
2. **Shared Secret:** User A computes ECDH shared secret: `Secret = X25519(Priv_A, Pub_B)`.
3. **Key Derivation:** User A derives a symmetric message key: `MessageKey = HKDF(Secret, Salt)`.
4. **Encryption:** User A generates a 12-byte random IV/Nonce.
5. **Ciphertext:** `Ciphertext, AuthTag = AES-256-GCM-Encrypt(MessageKey, IV, Plaintext)`.
6. User A sends `[Ciphertext, IV, AuthTag]` to the server. *(Note: Web Crypto API appends the AuthTag to the ciphertext automatically).*

## Decryption Flow
1. User B receives `[Ciphertext, IV]` and User A's public key (`Pub_A`).
2. User B computes shared secret: `Secret = X25519(Priv_B, Pub_A)`.
3. User B derives the exact same `MessageKey` via HKDF.
4. User B decrypts the payload using AES-256-GCM and the provided IV.
5. Plaintext is exposed to the UI for exactly 10 seconds before being purged from memory.

## Limitations
- This initial implementation relies on static Identity Keys. It does not yet implement the Double Ratchet algorithm; therefore, it does not provide Forward Secrecy or Post-Compromise Security.
- The 10-second lock is a UI/UX mechanism for local privacy (shoulder surfing), not a mathematical cryptographic lock.