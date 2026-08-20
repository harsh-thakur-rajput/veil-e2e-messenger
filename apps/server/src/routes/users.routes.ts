import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../database/client';

const keySchema = z.object({
  publicKey: z.string().min(1),
});

export default async function usersRoutes(server: FastifyInstance) {
  // Upload Public Key
  server.post('/keys', async (request, reply) => {
    const token = request.cookies.veil_session;
    if (!token) return reply.status(401).send({ success: false });

    const session = await prisma.session.findUnique({ where: { token } });
    if (!session || session.expiresAt < new Date()) {
      return reply.status(401).send({ success: false });
    }

    const { publicKey } = keySchema.parse(request.body);

    await prisma.identityKey.upsert({
      where: { userId: session.userId },
      update: { publicKey, algorithm: 'X25519' },
      create: { userId: session.userId, publicKey, algorithm: 'X25519' },
    });

    return reply.send({ success: true });
  });

  // Get all users available for chat (excluding current user)
  server.get('/', async (request, reply) => {
    const token = request.cookies.veil_session;
    if (!token) return reply.status(401).send({ success: false });

    const session = await prisma.session.findUnique({ where: { token } });
    if (!session) return reply.status(401).send({ success: false });

    const users = await prisma.user.findMany({
      where: { 
        id: { not: session.userId },
        identityKey: { isNot: null } // Only show users who have generated keys
      },
      select: { id: true, username: true, identityKey: true }
    });

    return reply.send({ success: true, users });
  });
}