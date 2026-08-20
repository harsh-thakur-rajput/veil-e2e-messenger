import { FastifyInstance } from 'fastify';
import * as argon2 from 'argon2';
import { z } from 'zod';
import { prisma } from '../database/client';
import { createSession } from '../auth/session';

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export default async function authRoutes(server: FastifyInstance) {
  // Login Endpoint
  server.post('/login', async (request, reply) => {
    try {
      const { username, password } = loginSchema.parse(request.body);

      const user = await prisma.user.findUnique({ where: { username } });
      if (!user) {
        return reply.status(401).send({ success: false, message: 'Invalid credentials' });
      }

      const isValid = await argon2.verify(user.passwordHash, password);
      if (!isValid) {
        return reply.status(401).send({ success: false, message: 'Invalid credentials' });
      }

      const { token, expiresAt } = await createSession(user.id);

      reply.setCookie('veil_session', token, {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        expires: expiresAt,
      });

      return reply.send({ success: true, user: { id: user.id, username: user.username } });
    } catch (error) {
      return reply.status(400).send({ success: false, message: 'Bad Request' });
    }
  });

  // Me Endpoint (Session Validation)
  server.get('/me', async (request, reply) => {
    const token = request.cookies.veil_session;
    if (!token) return reply.status(401).send({ success: false });

    const session = await prisma.session.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!session || session.expiresAt < new Date()) {
      return reply.status(401).send({ success: false });
    }

    return reply.send({ success: true, user: { id: session.user.id, username: session.user.username } });
  });

  // Logout Endpoint
  server.post('/logout', async (request, reply) => {
    const token = request.cookies.veil_session;
    if (token) {
      await prisma.session.deleteMany({ where: { token } });
    }
    reply.clearCookie('veil_session', { path: '/' });
    return reply.send({ success: true });
  });
}