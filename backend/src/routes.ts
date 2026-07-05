import type { Express } from 'express';
import { authRouter } from './modules/auth/auth.routes';
import { userRouter } from './modules/users/user.routes';
import { organizationRouter } from './modules/organizations/organization.routes';
import { teamRouter } from './modules/teams/team.routes';
import { channelRouter } from './modules/channels/channel.routes';
import { messageRouter } from './modules/messages/message.routes';
import { meetingRouter } from './modules/meetings/meeting.routes';
import { kanbanRouter } from './modules/kanban/kanban.routes';
import { searchRouter } from './modules/search/search.routes';
import { uploadRouter } from './modules/uploads/upload.routes';

/**
 * Registers every module's router under /api. Each module is self-contained;
 * this file is the only place the outer app "knows" about them.
 */
export const registerRoutes = (app: Express): void => {
  app.use('/api/auth', authRouter);
  app.use('/api/users', userRouter);
  app.use('/api/organizations', organizationRouter);
  app.use('/api/teams', teamRouter);
  app.use('/api/channels', channelRouter);
  app.use('/api/messages', messageRouter);
  app.use('/api/meetings', meetingRouter);
  app.use('/api/kanban', kanbanRouter);
  app.use('/api/search', searchRouter);
  app.use('/api/uploads', uploadRouter);
};
