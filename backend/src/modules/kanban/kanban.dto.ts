import { z } from 'zod';

export const createBoardSchema = z.object({
  teamId: z.string().min(1),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional().nullable(),
});
export type CreateBoardDto = z.infer<typeof createBoardSchema>;

export const createCardSchema = z.object({
  boardId: z.string().min(1),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional().nullable(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']).default('TODO'),
  assigneeId: z.string().optional().nullable(),
  dueDate: z.string().datetime().optional().nullable(),
});
export type CreateCardDto = z.infer<typeof createCardSchema>;

export const updateCardSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional().nullable(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']).optional(),
  position: z.number().int().nonnegative().optional(),
  assigneeId: z.string().nullable().optional(),
  dueDate: z.string().datetime().nullable().optional(),
});
export type UpdateCardDto = z.infer<typeof updateCardSchema>;

export const moveCardSchema = z.object({
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']),
  position: z.number().int().nonnegative(),
});
export type MoveCardDto = z.infer<typeof moveCardSchema>;
