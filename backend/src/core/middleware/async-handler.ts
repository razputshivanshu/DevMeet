import type { NextFunction, Request, Response } from 'express';

/**
 * Wraps async controller/service functions so thrown errors reach the error middleware.
 */
export const asyncHandler =
  <T extends Request = Request>(
    fn: (req: T, res: Response, next: NextFunction) => Promise<unknown>,
  ) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req as T, res, next)).catch(next);
  };
