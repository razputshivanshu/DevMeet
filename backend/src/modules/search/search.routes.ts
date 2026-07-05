import { Router, type Request, type Response } from 'express';
import { searchService } from './search.service';
import { requireAuth } from '../../core/middleware/auth';
import { asyncHandler } from '../../core/middleware/async-handler';
import { ok } from '../../core/utils/response';
import { BadRequestError, UnauthorizedError } from '../../core/errors/app-error';

export const searchRouter = Router();

searchRouter.use(requireAuth);

searchRouter.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new UnauthorizedError();
    const organizationId = String(req.query.organizationId ?? '');
    const q = String(req.query.q ?? '');
    if (!organizationId) throw new BadRequestError('organizationId is required');
    const results = await searchService.searchAll(req.user.id, organizationId, q);
    return ok(res, results);
  }),
);
