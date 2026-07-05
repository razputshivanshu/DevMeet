import { z } from 'zod';

export const createMeetingSchema = z.object({
  organizationId: z.string().min(1),
  title: z.string().min(1).max(150),
});
export type CreateMeetingDto = z.infer<typeof createMeetingSchema>;
