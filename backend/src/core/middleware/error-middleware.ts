import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { AppError } from '../errors/app-error';
import { env } from '../../config/env';

/**
 * 404 handler — must be registered after all routes.
 */
export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: `Route ${req.method} ${req.originalUrl} not found` },
  });
};

/**
 * Central error middleware. Maps domain, validation, and Prisma errors to HTTP.
 */
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  // Zod validation
  if (err instanceof ZodError) {
    res.status(422).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: err.flatten(),
      },
    });
    return;
  }

  // Domain errors
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: { code: err.code, message: err.message, details: err.details },
    });
    return;
  }

  // Prisma known errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      res.status(409).json({
        success: false,
        error: {
          code: 'CONFLICT',
          message: 'Unique constraint violated',
          details: err.meta,
        },
      });
      return;
    }
    if (err.code === 'P2025') {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Record not found' },
      });
      return;
    }
  }

  // Fallback
  // eslint-disable-next-line no-console
  console.error('[unhandled error]', err);
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: env.isProd ? 'Internal server error' : (err as Error).message,
      ...(env.isProd ? {} : { stack: (err as Error).stack }),
    },
  });
};
