import type { Request, Response } from 'express';
import { kanbanService } from './kanban.service';
import { created, noContent, ok } from '../../core/utils/response';
import { UnauthorizedError } from '../../core/errors/app-error';

const uid = (req: Request) => {
  if (!req.user) throw new UnauthorizedError();
  return req.user.id;
};

export class KanbanController {
  // Boards
  listBoards = async (req: Request, res: Response) =>
    ok(res, await kanbanService.listBoards(uid(req), String(req.query.teamId)));
  createBoard = async (req: Request, res: Response) =>
    created(res, await kanbanService.createBoard(uid(req), req.body));
  getBoard = async (req: Request, res: Response) =>
    ok(res, await kanbanService.getBoard(uid(req), req.params.boardId));
  deleteBoard = async (req: Request, res: Response) => {
    await kanbanService.deleteBoard(uid(req), req.params.boardId);
    return noContent(res);
  };

  // Cards
  createCard = async (req: Request, res: Response) =>
    created(res, await kanbanService.createCard(uid(req), req.body));
  updateCard = async (req: Request, res: Response) =>
    ok(res, await kanbanService.updateCard(uid(req), req.params.cardId, req.body));
  moveCard = async (req: Request, res: Response) =>
    ok(res, await kanbanService.moveCard(uid(req), req.params.cardId, req.body));
  deleteCard = async (req: Request, res: Response) => {
    await kanbanService.deleteCard(uid(req), req.params.cardId);
    return noContent(res);
  };
}

export const kanbanController = new KanbanController();
