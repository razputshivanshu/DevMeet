import { Router } from 'express';
import { kanbanController } from './kanban.controller';
import { requireAuth } from '../../core/middleware/auth';
import { asyncHandler } from '../../core/middleware/async-handler';
import { validate } from '../../core/middleware/validate';
import {
  createBoardSchema,
  createCardSchema,
  moveCardSchema,
  updateCardSchema,
} from './kanban.dto';

export const kanbanRouter = Router();

kanbanRouter.use(requireAuth);

// Boards
kanbanRouter.get('/boards', asyncHandler(kanbanController.listBoards));
kanbanRouter.post(
  '/boards',
  validate(createBoardSchema),
  asyncHandler(kanbanController.createBoard),
);
kanbanRouter.get('/boards/:boardId', asyncHandler(kanbanController.getBoard));
kanbanRouter.delete('/boards/:boardId', asyncHandler(kanbanController.deleteBoard));

// Cards
kanbanRouter.post('/cards', validate(createCardSchema), asyncHandler(kanbanController.createCard));
kanbanRouter.patch(
  '/cards/:cardId',
  validate(updateCardSchema),
  asyncHandler(kanbanController.updateCard),
);
kanbanRouter.post(
  '/cards/:cardId/move',
  validate(moveCardSchema),
  asyncHandler(kanbanController.moveCard),
);
kanbanRouter.delete('/cards/:cardId', asyncHandler(kanbanController.deleteCard));
