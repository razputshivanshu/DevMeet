import { api, request } from '@/lib/api';
import type { OrgMember, Organization } from '@/types';

export const orgService = {
  list: () => request<Organization[]>(() => api.get('/organizations')),
  get: (id: string) => request<Organization>(() => api.get(`/organizations/${id}`)),
  create: (dto: { name: string; slug: string; description?: string }) =>
    request<Organization>(() => api.post('/organizations', dto)),
  members: (id: string) => request<OrgMember[]>(() => api.get(`/organizations/${id}/members`)),
  invite: (id: string, dto: { email: string; role: 'ADMIN' | 'MEMBER' }) =>
    request<{ token: string; email: string }>(() => api.post(`/organizations/${id}/invites`, dto)),
  invites: (id: string) => request<any[]>(() => api.get(`/organizations/${id}/invites`)),
  acceptInvite: (token: string) =>
    request<Organization>(() => api.post('/organizations/invites/accept', { token })),
  updateMemberRole: (id: string, userId: string, role: 'OWNER' | 'ADMIN' | 'MEMBER') =>
    request<OrgMember>(() => api.patch(`/organizations/${id}/members/${userId}`, { role })),
  removeMember: (id: string, userId: string) =>
    api.delete(`/organizations/${id}/members/${userId}`).then(() => true),
};
