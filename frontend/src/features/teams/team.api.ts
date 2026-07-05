import { api, request } from '@/lib/api';
import type { Team } from '@/types';

export const teamService = {
  listByOrg: (organizationId: string) =>
    request<Team[]>(() => api.get('/teams', { params: { organizationId } })),
  mine: () => request<Team[]>(() => api.get('/teams/mine')),
  get: (id: string) => request<Team>(() => api.get(`/teams/${id}`)),
  create: (dto: { organizationId: string; name: string; description?: string }) =>
    request<Team>(() => api.post('/teams', dto)),
  join: (id: string) => request<any>(() => api.post(`/teams/${id}/join`)),
  leave: (id: string) => api.post(`/teams/${id}/leave`).then(() => true),
  members: (id: string) => request<any[]>(() => api.get(`/teams/${id}/members`)),
};
