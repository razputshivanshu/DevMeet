import { Router } from 'express';
import { meetingController } from './meeting.controller';
import { requireAuth } from '../../core/middleware/auth';
import { asyncHandler } from '../../core/middleware/async-handler';
import { validate } from '../../core/middleware/validate';
import { createMeetingSchema } from './meeting.dto';

export const meetingRouter = Router();

meetingRouter.use(requireAuth);

meetingRouter.get('/', asyncHandler(meetingController.list));
meetingRouter.post('/', validate(createMeetingSchema), asyncHandler(meetingController.create));
meetingRouter.get('/:roomCode', asyncHandler(meetingController.get));
meetingRouter.post('/:roomCode/join', asyncHandler(meetingController.join));
meetingRouter.post('/:roomCode/leave', asyncHandler(meetingController.leave));
meetingRouter.post('/:roomCode/end', asyncHandler(meetingController.end));
