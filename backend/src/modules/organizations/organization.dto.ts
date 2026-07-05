import { z } from 'zod';

export const createOrganizationSchema = z.object({
  name: z.string().min(2).max(100),
  slug: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase, digits or dashes'),
  description: z.string().max(500).optional().nullable(),
});
export type CreateOrganizationDto = z.infer<typeof createOrganizationSchema>;

export const inviteMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(['ADMIN', 'MEMBER']).default('MEMBER'),
});
export type InviteMemberDto = z.infer<typeof inviteMemberSchema>;

export const acceptInviteSchema = z.object({
  token: z.string().min(10),
});
export type AcceptInviteDto = z.infer<typeof acceptInviteSchema>;

export const updateMemberRoleSchema = z.object({
  role: z.enum(['OWNER', 'ADMIN', 'MEMBER']),
});
export type UpdateMemberRoleDto = z.infer<typeof updateMemberRoleSchema>;
