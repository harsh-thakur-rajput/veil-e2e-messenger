import { FastifyInstance } from 'fastify';
import '@fastify/websocket';
import { WebSocket } from 'ws';
import { prisma } from '../database/client';

// Map of active user connections: userId -> WebSocket
const activeConnections = new Map<string, WebSocket>();

export default async function websocketHandler(server: FastifyInstance) {
  server.get('/ws', { websocket: true }, async (connection, req) => {
    // 1. Authenticate WS connection using cookies
    const token = server.parseCookie(req.headers.cookie || '')['veil_session'];
    if (!token) {
      connection.socket.close(1008, 'Unauthorized');
      return;
    }

    const session = await prisma.session.findUnique({ where: { token } });
    if (!session || session.expiresAt < new Date()) {
      connection.socket.close(1008, 'Unauthorized');
      return;
    }

    const userId = session.userId;
    activeConnections.set(userId, connection.socket);
    console.log(`📡 User ${userId} connected to WebSockets`);

    connection.socket.on('message', async (data) => {
      try {
        const payload = JSON.parse(data.toString());

        if (payload.type === 'message:send') {
          const { conversationId, ciphertext, nonce } = payload.data;

          // Save purely the ciphertext to Postgres
          const savedMessage = await prisma.message.create({
            data: {
              conversationId,
              senderId: userId,
              ciphertext,
              nonce,
              encryptionVersion: 1
            }
          });

          // Update conversation timestamp
          await prisma.conversation.update({
            where: { id: conversationId },
            data: { updatedAt: new Date() }
          });

          // Broadcast to all members of the conversation
          const members = await prisma.conversationMember.findMany({
            where: { conversationId }
          });

          members.forEach((member) => {
            const socket = activeConnections.get(member.userId);
            if (socket && socket.readyState === WebSocket.OPEN) {
              socket.send(JSON.stringify({
                type: 'message:receive',
                data: savedMessage
              }));
            }
          });
        }
      } catch (err) {
        console.error('WS Error:', err);
      }
    });

    connection.socket.on('close', () => {
      activeConnections.delete(userId);
      console.log(`🔌 User ${userId} disconnected`);
    });
  });
}