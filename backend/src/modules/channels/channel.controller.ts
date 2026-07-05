import type { Request, Response } from 'express';
import { channelService } from './channel.service';
import { created, noContent, ok } from '../../core/utils/response';
import { UnauthorizedError } from '../../core/errors/app-error';

const uid = (req: Request) => {
  if (!req.user) throw new UnauthorizedError();
  return req.user.id;
};

export class ChannelController {
  create = async (req: Request, res: Response) =>
    created(res, await channelService.create(uid(req), req.body));
  list = async (req: Request, res: Response) => {
    const organizationId = req.query.organizationId ? String(req.query.organizationId) : undefined;
    return ok(res, await channelService.list(uid(req), organizationId));
  };
  get = async (req: Request, res: Response) =>
    ok(res, await channelService.get(uid(req), req.params.channelId));
  update = async (req: Request, res: Response) =>
    ok(res, await channelService.update(uid(req), req.params.channelId, req.body));
  delete = async (req: Request, res: Response) => {
    await channelService.delete(uid(req), req.params.channelId);
    return noContent(res);
  };
  join = async (req: Request, res: Response) =>
    ok(res, await channelService.join(uid(req), req.params.channelId));
  leave = async (req: Request, res: Response) => {
    await channelService.leave(uid(req), req.params.channelId);
    return noContent(res);
  };
  members = async (req: Request, res: Response) =>
    ok(res, await channelService.listMembers(uid(req), req.params.channelId));
  addMember = async (req: Request, res: Response) =>
    created(
      res,
      await channelService.addMember(uid(req), req.params.channelId, String(req.body.userId)),
    );
  removeMember = async (req: Request, res: Response) => {
    await channelService.removeMember(uid(req), req.params.channelId, req.params.userId);
    return noContent(res);
  };
}

export const channelController = new ChannelController();
