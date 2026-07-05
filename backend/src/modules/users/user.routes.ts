import { Router } from 'express';
import { userController } from './user.controller';
import { requireAuth } from '../../core/middleware/auth';
import { asyncHandler } from '../../core/middleware/async-handler';
import { validate } from '../../core/middleware/validate';
import { updateProfileSchema } from './user.dto';

export const userRouter = Router();

userRouter.use(requireAuth);

userRouter.get('/search', asyncHandler(userController.search));
userRouter.patch('/me', validate(updateProfileSchema), asyncHandler(userController.updateMe));
userRouter.get('/:id', asyncHandler(userController.getById));
