import { api, request } from '@/lib/api';
import type { Meeting } from '@/types';

export const meetingService = {
  list: (organizationId: string) =>
    request<Meeting[]>(() => api.get('/meetings', { params: { organizationId } })),
  create: (dto: { organizationId: string; title: string }) =>
    request<Meeting>(() => api.post('/meetings', dto)),
  get: (roomCode: string) => request<Meeting>(() => api.get(`/meetings/${roomCode}`)),
  join: (roomCode: string) => request<Meeting>(() => api.post(`/meetings/${roomCode}/join`)),
  leave: (roomCode: string) =>
    request<{ left: boolean }>(() => api.post(`/meetings/${roomCode}/leave`)),
  end: (roomCode: string) => request<Meeting>(() => api.post(`/meetings/${roomCode}/end`)),
};
