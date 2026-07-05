import { Router } from 'express';
import { organizationController } from './organization.controller';
import { requireAuth } from '../../core/middleware/auth';
import { asyncHandler } from '../../core/middleware/async-handler';
import { validate } from '../../core/middleware/validate';
import {
  acceptInviteSchema,
  createOrganizationSchema,
  inviteMemberSchema,
  updateMemberRoleSchema,
} from './organization.dto';

export const organizationRouter = Router();

organizationRouter.use(requireAuth);

organizationRouter.get('/', asyncHandler(organizationController.list));
organizationRouter.post(
  '/',
  validate(createOrganizationSchema),
  asyncHandler(organizationController.create),
);
organizationRouter.post(
  '/invites/accept',
  validate(acceptInviteSchema),
  asyncHandler(organizationController.acceptInvite),
);
organizationRouter.get('/invites/pending', asyncHandler(organizationController.pendingInvites));
organizationRouter.get('/:organizationId', asyncHandler(organizationController.get));
organizationRouter.get('/:organizationId/members', asyncHandler(organizationController.members));
organizationRouter.get(
  '/:organizationId/invites',
  asyncHandler(organizationController.listInvites),
);
organizationRouter.post(
  '/:organizationId/invites',
  validate(inviteMemberSchema),
  asyncHandler(organizationController.invite),
);
organizationRouter.patch(
  '/:organizationId/members/:userId',
  validate(updateMemberRoleSchema),
  asyncHandler(organizationController.updateMemberRole),
);
organizationRouter.delete(
  '/:organizationId/members/:userId',
  asyncHandler(organizationController.removeMember),
);
