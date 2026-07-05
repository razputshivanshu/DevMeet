import type { Request, Response } from 'express';
import { userService } from './user.service';
import { ok } from '../../core/utils/response';
import { UnauthorizedError } from '../../core/errors/app-error';

export class UserController {
  getById = async (req: Request, res: Response) => {
    const user = await userService.getById(req.params.id);
    return ok(res, user);
  };

  updateMe = async (req: Request, res: Response) => {
    if (!req.user) throw new UnauthorizedError();
    const user = await userService.updateProfile(req.user.id, req.body);
    return ok(res, user);
  };

  search = async (req: Request, res: Response) => {
    const q = String(req.query.q ?? '').trim();
    if (!q) return ok(res, []);
    const users = await userService.search(q, req.user?.id);
    return ok(res, users);
  };
}

export const userController = new UserController();
