import { z } from 'zod';

export const createTeamSchema = z.object({
  organizationId: z.string().min(1),
  name: z.string().min(2).max(80),
  description: z.string().max(500).optional().nullable(),
});
export type CreateTeamDto = z.infer<typeof createTeamSchema>;

export const updateTeamSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  description: z.string().max(500).optional().nullable(),
});
export type UpdateTeamDto = z.infer<typeof updateTeamSchema>;

export const addTeamMemberSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(['LEAD', 'MEMBER']).default('MEMBER'),
});
export type AddTeamMemberDto = z.infer<typeof addTeamMemberSchema>;
