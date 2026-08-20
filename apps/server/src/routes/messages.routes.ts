import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../database/client';

export default async function messagesRoutes(server: FastifyInstance) {
  server.get('/:conversationId', async (request, reply) => {
    const token = request.cookies.veil_session;
    if (!token) return reply.status(401).send({ success: false });

    const session = await prisma.session.findUnique({ where: { token } });
    if (!session) return reply.status(401).send({ success: false });

    const { conversationId } = z.object({ conversationId: z.string() }).parse(request.params);

    // Ensure user is part of the conversation
    const member = await prisma.conversationMember.findUnique({
      where: { conversationId_userId: { conversationId, userId: session.userId } }
    });

    if (!member) return reply.status(403).send({ success: false, message: 'Forbidden' });

    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' }
    });

    return reply.send({ success: true, messages });
  });
}