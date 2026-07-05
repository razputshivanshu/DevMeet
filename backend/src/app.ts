import express, { type Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { env } from './config/env';
import { errorHandler, notFoundHandler } from './core/middleware/error-middleware';
import { registerRoutes } from './routes';

export const createApp = (): Express => {
  const app = express();

  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(
    cors({
      origin: env.CORS_ORIGIN.split(',').map((s) => s.trim()),
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));
  if (env.isDev) app.use(morgan('dev'));

  // Static uploads directory
  app.use('/uploads', express.static(path.resolve(env.UPLOAD_DIR)));

  // Health
  app.get('/api/health', (_req, res) => {
    res.json({
      success: true,
      data: { status: 'ok', env: env.NODE_ENV, time: new Date().toISOString() },
    });
  });

  // Feature routes
  registerRoutes(app);

  // 404 + error
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
