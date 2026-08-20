# VEIL - Threat Model

## Assets Protected
- Message contents (in transit and at rest).
- User passwords.
- Local screen privacy (via 10-second visibility lock).

## Adversaries & Mitigations

### 1. Compromised Server / Malicious Admin
- **Threat:** Server database is dumped or an admin attempts to read messages.
- **Mitigation:** End-to-end encryption. The server only holds public keys and ciphertexts. The server cannot derive the shared secret without a client private key.

### 2. Network Eavesdropper (Man-in-the-Middle)
- **Threat:** ISP or attacker intercepts WebSocket/HTTP traffic.
- **Mitigation:** TLS 1.3 secures the transport layer. E2EE secures the payload even if TLS is stripped.

### 3. Local "Shoulder Surfer"
- **Threat:** A bystander looks at the user's screen while the app is open.
- **Mitigation:** Messages display as ciphertext hashes by default. Plaintext is only revealed via explicit user action and is automatically purged after 10 seconds or upon tab blur.

### 4. Malicious Client (Spoofing)
- **Threat:** An attacker manipulates WebSocket events to forge the `senderId`.
- **Mitigation:** The server enforces strict authorization based on the secure session cookie. A user can only send messages authored by their authenticated ID.

## Out of Scope (Accepted Risks)
- **Endpoint Compromise:** If the client device is infected with malware (keyloggers, memory scrapers), the plaintext can be stolen before encryption or during the 10-second decryption window.
- **Screen Recording:** The OS can record the screen during the 10-second window. The app does not attempt to hook deeply into the OS to prevent screenshots, as this is reliably impossible in web browsers.
- **Metadata:** The server still knows *who* is talking to *whom*, and *when*.