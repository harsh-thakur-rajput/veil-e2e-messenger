import Fastify from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import websocketPlugin from '@fastify/websocket';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.routes';
import usersRoutes from './routes/users.routes';
import conversationsRoutes from './routes/conversations.routes';
import messagesRoutes from './routes/messages.routes';
import websocketHandler from './websocket/handler';

dotenv.config({ path: '../../.env' });

const server = Fastify({ logger: true });

// 1. Security Headers (Helmet)
// We disable contentSecurityPolicy temporarily in dev so Vite's HMR scripts aren't blocked
server.register(helmet, {
  contentSecurityPolicy: process.env.NODE_ENV === 'production',
  crossOriginResourcePolicy: { policy: "cross-origin" }
});

// 2. Rate Limiting (Prevent Brute Force)
server.register(rateLimit, {
  max: 100, // Maximum 100 requests...
  timeWindow: '1 minute', // ...per minute per IP
  errorResponseBuilder: function (request, context) {
    return {
      success: false,
      message: 'Rate limit exceeded, please try again later.'
    };
  }
});

// 3. CORS
server.register(cors, {
  origin: 'http://localhost:5173',
  credentials: true,
});

// 4. Cookies
server.register(cookie, {
  secret: process.env.SESSION_SECRET || 'fallback_secret_for_dev',
});

// 5. WebSockets
server.register(websocketPlugin);

// 6. API Routes
server.register(authRoutes, { prefix: '/api/auth' });
server.register(usersRoutes, { prefix: '/api/users' });
server.register(conversationsRoutes, { prefix: '/api/conversations' });
server.register(messagesRoutes, { prefix: '/api/messages' });

// 7. WebSocket Handler
server.register(websocketHandler);

server.get('/health', async () => ({ status: 'ok', service: 'veil-server' }));

const start = async () => {
  try {
    const port = parseInt(process.env.PORT || '3001', 10);
    await server.listen({ port, host: '0.0.0.0' });
    console.log(`🔒 VEIL Server running securely on http://localhost:${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();