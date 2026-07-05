import type { Request, Response } from 'express';
import { authService } from './auth.service';
import { ok, created } from '../../core/utils/response';
import { UnauthorizedError } from '../../core/errors/app-error';

export class AuthController {
  register = async (req: Request, res: Response) => {
    const result = await authService.register(req.body);
    return created(res, result);
  };

  login = async (req: Request, res: Response) => {
    const result = await authService.login(req.body);
    return ok(res, result);
  };

  me = async (req: Request, res: Response) => {
    if (!req.user) throw new UnauthorizedError();
    const user = await authService.me(req.user.id);
    return ok(res, user);
  };

  forgotPassword = async (req: Request, res: Response) => {
    const { resetToken } = await authService.requestPasswordReset(req.body.email);
    // For MVP we return the token so devs can test end-to-end. In prod, mail it and return only {sent:true}.
    return ok(res, { sent: true, resetToken });
  };

  resetPassword = async (req: Request, res: Response) => {
    await authService.resetPassword(req.body);
    return ok(res, { reset: true });
  };
}

export const authController = new AuthController();
