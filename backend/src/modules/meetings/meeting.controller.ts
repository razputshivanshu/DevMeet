import type { Request, Response } from 'express';
import { meetingService } from './meeting.service';
import { created, ok } from '../../core/utils/response';
import { UnauthorizedError } from '../../core/errors/app-error';

const uid = (req: Request) => {
  if (!req.user) throw new UnauthorizedError();
  return req.user.id;
};

export class MeetingController {
  create = async (req: Request, res: Response) =>
    created(res, await meetingService.create(uid(req), req.body));
  list = async (req: Request, res: Response) =>
    ok(res, await meetingService.list(uid(req), String(req.query.organizationId)));
  get = async (req: Request, res: Response) =>
    ok(res, await meetingService.getByCode(uid(req), req.params.roomCode));
  join = async (req: Request, res: Response) =>
    ok(res, await meetingService.join(uid(req), req.params.roomCode));
  leave = async (req: Request, res: Response) =>
    ok(res, await meetingService.leave(uid(req), req.params.roomCode));
  end = async (req: Request, res: Response) =>
    ok(res, await meetingService.end(uid(req), req.params.roomCode));
}

export const meetingController = new MeetingController();
