import { z } from 'zod';

export const createMessageSchema = z.object({
  channelId: z.string().min(1),
  content: z.string().min(1).max(5000),
  fileUrl: z.string().url().optional().nullable(),
  fileName: z.string().max(255).optional().nullable(),
  fileSize: z.number().int().nonnegative().optional().nullable(),
});
export type CreateMessageDto = z.infer<typeof createMessageSchema>;

export const listMessagesSchema = z.object({
  channelId: z.string().min(1),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});
export type ListMessagesDto = z.infer<typeof listMessagesSchema>;

export const reactionSchema = z.object({
  emoji: z.string().min(1).max(32),
});
export type ReactionDto = z.infer<typeof reactionSchema>;
