import { z } from 'zod';

export const createChannelSchema = z.object({
  organizationId: z.string().min(1),
  teamId: z.string().min(1).optional().nullable(),
  name: z
    .string()
    .min(2)
    .max(60)
    .regex(/^[a-z0-9-]+$/, 'Channel names must be lowercase, digits or dashes'),
  topic: z.string().max(250).optional().nullable(),
  type: z.enum(['PUBLIC', 'PRIVATE']).default('PUBLIC'),
});
export type CreateChannelDto = z.infer<typeof createChannelSchema>;

export const updateChannelSchema = z.object({
  name: z
    .string()
    .min(2)
    .max(60)
    .regex(/^[a-z0-9-]+$/)
    .optional(),
  topic: z.string().max(250).optional().nullable(),
});
export type UpdateChannelDto = z.infer<typeof updateChannelSchema>;
