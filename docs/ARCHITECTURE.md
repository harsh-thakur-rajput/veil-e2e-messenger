# VEIL - Architecture Blueprint

## System Overview
VEIL is a client-server realtime messaging application designed with zero-knowledge principles regarding message content. The server facilitates authentication, public key distribution, and ciphertext routing, but possesses no ability to decrypt payloads.

## Components
1. **VEIL Web Client (React/Vite)**
   - Manages local cryptographic key pairs.
   - Handles the 10-second volatile decryption UI layer.
   - Communicates via REST (Auth/Keys) and WebSockets (Realtime messaging).

2. **VEIL Server (Fastify/Node.js)**
   - Manages user accounts and authenticates sessions via HTTP-Only Cookies.
   - Serves as a public key directory.
   - Routes and persists end-to-end encrypted messages.

3. **Database (PostgreSQL)**
   - Stores users, public identity keys, conversations, and ciphertexts.
   - Strict rule: No columns shall exist for `plaintext` or `decrypted_content`.

## Monorepo Strategy
- **`apps/web`**: Contains all UI, local crypto logic, and temporary visibility state hooks.
- **`apps/server`**: Contains REST routes, WebSocket handlers, and Prisma client.
- **`packages/shared`**: Contains TypeScript interfaces defining the exact contract of encrypted payloads and WebSocket events to ensure client/server sync.