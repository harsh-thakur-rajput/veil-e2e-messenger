import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../database/client';

export default async function conversationsRoutes(server: FastifyInstance) {
  // Get or Create a 1-on-1 conversation
  server.post('/direct', async (request, reply) => {
    const token = request.cookies.veil_session;
    if (!token) return reply.status(401).send({ success: false });

    const session = await prisma.session.findUnique({ where: { token } });
    if (!session) return reply.status(401).send({ success: false });

    const { targetUserId } = z.object({ targetUserId: z.string() }).parse(request.body);

    // Check if conversation already exists
    const existingConvos = await prisma.conversation.findMany({
      where: {
        isGroup: false,
        AND: [
          { members: { some: { userId: session.userId } } },
          { members: { some: { userId: targetUserId } } }
        ]
      },
      include: { members: { include: { user: { include: { identityKey: true } } } } }
    });

    if (existingConvos.length > 0) {
      return reply.send({ success: true, conversation: existingConvos[0] });
    }

    // Create new conversation
    const newConvo = await prisma.conversation.create({
      data: {
        isGroup: false,
        members: {
          create: [{ userId: session.userId }, { userId: targetUserId }]
        }
      },
      include: { members: { include: { user: { include: { identityKey: true } } } } }
    });

    return reply.send({ success: true, conversation: newConvo });
  });

  // Get all conversations for current user
  server.get('/', async (request, reply) => {
    const token = request.cookies.veil_session;
    if (!token) return reply.status(401).send({ success: false });

    const session = await prisma.session.findUnique({ where: { token } });
    if (!session) return reply.status(401).send({ success: false });

    const conversations = await prisma.conversation.findMany({
      where: { members: { some: { userId: session.userId } } },
      include: { members: { include: { user: { select: { id: true, username: true, identityKey: true } } } } },
      orderBy: { updatedAt: 'desc' }
    });

    return reply.send({ success: true, conversations });
  });
}