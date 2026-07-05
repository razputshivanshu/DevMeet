import type { Request, Response } from 'express';
import { messageService } from './message.service';
import { created, noContent, ok } from '../../core/utils/response';
import { UnauthorizedError } from '../../core/errors/app-error';

const uid = (req: Request) => {
  if (!req.user) throw new UnauthorizedError();
  return req.user.id;
};

export class MessageController {
  create = async (req: Request, res: Response) =>
    created(res, await messageService.create(uid(req), req.body));

  list = async (req: Request, res: Response) => {
    const channelId = String(req.query.channelId);
    const cursor = req.query.cursor ? String(req.query.cursor) : undefined;
    const limit = req.query.limit ? Number(req.query.limit) : 50;
    return ok(res, await messageService.list(uid(req), channelId, cursor, limit));
  };

  delete = async (req: Request, res: Response) => {
    await messageService.delete(uid(req), req.params.messageId);
    return noContent(res);
  };

  addReaction = async (req: Request, res: Response) =>
    ok(res, await messageService.addReaction(uid(req), req.params.messageId, req.body.emoji));

  removeReaction = async (req: Request, res: Response) =>
    ok(
      res,
      await messageService.removeReaction(uid(req), req.params.messageId, String(req.params.emoji)),
    );
}

export const messageController = new MessageController();
