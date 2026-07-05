import { Router } from 'express';
import { messageController } from './message.controller';
import { requireAuth } from '../../core/middleware/auth';
import { asyncHandler } from '../../core/middleware/async-handler';
import { validate } from '../../core/middleware/validate';
import { createMessageSchema, reactionSchema } from './message.dto';

export const messageRouter = Router();

messageRouter.use(requireAuth);

messageRouter.get('/', asyncHandler(messageController.list));
messageRouter.post('/', validate(createMessageSchema), asyncHandler(messageController.create));
messageRouter.delete('/:messageId', asyncHandler(messageController.delete));
messageRouter.post(
  '/:messageId/reactions',
  validate(reactionSchema),
  asyncHandler(messageController.addReaction),
);
messageRouter.delete(
  '/:messageId/reactions/:emoji',
  asyncHandler(messageController.removeReaction),
);
