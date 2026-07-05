import { Router } from 'express';
import { authController } from './auth.controller';
import { validate } from '../../core/middleware/validate';
import { asyncHandler } from '../../core/middleware/async-handler';
import { requireAuth } from '../../core/middleware/auth';
import { forgotPasswordSchema, loginSchema, registerSchema, resetPasswordSchema } from './auth.dto';
import { googleAuthRouter } from './google-oauth';

export const authRouter = Router();

authRouter.post('/register', validate(registerSchema), asyncHandler(authController.register));
authRouter.post('/login', validate(loginSchema), asyncHandler(authController.login));
authRouter.get('/me', requireAuth, asyncHandler(authController.me));
authRouter.post(
  '/forgot-password',
  validate(forgotPasswordSchema),
  asyncHandler(authController.forgotPassword),
);
authRouter.post(
  '/reset-password',
  validate(resetPasswordSchema),
  asyncHandler(authController.resetPassword),
);

// Google OAuth (gracefully disabled if creds are missing)
authRouter.use('/google', googleAuthRouter);
