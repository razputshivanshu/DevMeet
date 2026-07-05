import { Router } from 'express';
import { z } from 'zod';
import { channelController } from './channel.controller';
import { requireAuth } from '../../core/middleware/auth';
import { asyncHandler } from '../../core/middleware/async-handler';
import { validate } from '../../core/middleware/validate';
import { createChannelSchema, updateChannelSchema } from './channel.dto';

export const channelRouter = Router();

channelRouter.use(requireAuth);

channelRouter.get('/', asyncHandler(channelController.list));
channelRouter.post('/', validate(createChannelSchema), asyncHandler(channelController.create));
channelRouter.get('/:channelId', asyncHandler(channelController.get));
channelRouter.patch(
  '/:channelId',
  validate(updateChannelSchema),
  asyncHandler(channelController.update),
);
channelRouter.delete('/:channelId', asyncHandler(channelController.delete));
channelRouter.post('/:channelId/join', asyncHandler(channelController.join));
channelRouter.post('/:channelId/leave', asyncHandler(channelController.leave));
channelRouter.get('/:channelId/members', asyncHandler(channelController.members));
channelRouter.post(
  '/:channelId/members',
  validate(z.object({ userId: z.string().min(1) })),
  asyncHandler(channelController.addMember),
);
channelRouter.delete('/:channelId/members/:userId', asyncHandler(channelController.removeMember));
