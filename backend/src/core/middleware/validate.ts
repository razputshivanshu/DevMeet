import type { NextFunction, Request, Response } from 'express';
import type { ZodSchema } from 'zod';

type Source = 'body' | 'query' | 'params';

/**
 * Runs a Zod schema against a request property and replaces it with the parsed value.
 */
export const validate =
  (schema: ZodSchema, source: Source = 'body') =>
  (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      next(result.error);
      return;
    }
    // Replace parsed data (strips unknown fields, applies transforms)
    (req as unknown as Record<string, unknown>)[source] = result.data;
    next();
  };
