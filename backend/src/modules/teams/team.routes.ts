import { Router } from 'express';
import { teamController } from './team.controller';
import { requireAuth } from '../../core/middleware/auth';
import { asyncHandler } from '../../core/middleware/async-handler';
import { validate } from '../../core/middleware/validate';
import { addTeamMemberSchema, createTeamSchema, updateTeamSchema } from './team.dto';

export const teamRouter = Router();

teamRouter.use(requireAuth);

teamRouter.get('/', asyncHandler(teamController.listByOrg)); // ?organizationId=...
teamRouter.get('/mine', asyncHandler(teamController.listMine));
teamRouter.post('/', validate(createTeamSchema), asyncHandler(teamController.create));
teamRouter.get('/:teamId', asyncHandler(teamController.get));
teamRouter.patch('/:teamId', validate(updateTeamSchema), asyncHandler(teamController.update));
teamRouter.delete('/:teamId', asyncHandler(teamController.delete));
teamRouter.post('/:teamId/join', asyncHandler(teamController.join));
teamRouter.post('/:teamId/leave', asyncHandler(teamController.leave));
teamRouter.get('/:teamId/members', asyncHandler(teamController.members));
teamRouter.post(
  '/:teamId/members',
  validate(addTeamMemberSchema),
  asyncHandler(teamController.addMember),
);
teamRouter.delete('/:teamId/members/:userId', asyncHandler(teamController.removeMember));
