import http from 'http';
import { createApp } from './app';
import { env } from './config/env';
import { prisma } from './config/prisma';
import { initSocket } from './core/socket/socket';

const bootstrap = async () => {
  // Verify DB connection early so we fail fast in dev.
  try {
    await prisma.$connect();
    // eslint-disable-next-line no-console
    console.log('✅ Connected to PostgreSQL');
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('❌ Failed to connect to database:', err);
    process.exit(1);
  }

  const app = createApp();
  const httpServer = http.createServer(app);
  initSocket(httpServer);

  httpServer.listen(env.PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`🚀 DevMeet backend running on http://localhost:${env.PORT}`);
    // eslint-disable-next-line no-console
    console.log(`   Environment: ${env.NODE_ENV}`);
    // eslint-disable-next-line no-console
    console.log(`   Google OAuth: ${env.googleOAuthEnabled ? 'enabled' : 'disabled'}`);
  });

  const shutdown = async (signal: string) => {
    // eslint-disable-next-line no-console
    console.log(`\n${signal} received. Shutting down gracefully...`);
    httpServer.close();
    await prisma.$disconnect();
    process.exit(0);
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
};

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Fatal bootstrap error', err);
  process.exit(1);
});
