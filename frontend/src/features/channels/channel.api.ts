import { api, request } from '@/lib/api';
import type { Channel } from '@/types';

export const channelService = {
  list: (organizationId: string) =>
    request<Channel[]>(() => api.get('/channels', { params: { organizationId } })),
  get: (id: string) => request<Channel>(() => api.get(`/channels/${id}`)),
  create: (dto: {
    organizationId: string;
    teamId?: string | null;
    name: string;
    topic?: string;
    type: 'PUBLIC' | 'PRIVATE';
  }) => request<Channel>(() => api.post('/channels', dto)),
  join: (id: string) => request<any>(() => api.post(`/channels/${id}/join`)),
  leave: (id: string) => api.post(`/channels/${id}/leave`).then(() => true),
  members: (id: string) => request<any[]>(() => api.get(`/channels/${id}/members`)),
};
