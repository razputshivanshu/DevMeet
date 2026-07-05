import { api, request } from '@/lib/api';
import type { Message } from '@/types';

export const messageService = {
  list: (channelId: string, cursor?: string) =>
    request<{ items: Message[]; nextCursor: string | null }>(() =>
      api.get('/messages', { params: { channelId, cursor } }),
    ),
  create: (dto: {
    channelId: string;
    content: string;
    fileUrl?: string;
    fileName?: string;
    fileSize?: number;
  }) => request<Message>(() => api.post('/messages', dto)),
  delete: (id: string) => api.delete(`/messages/${id}`).then(() => true),
  addReaction: (id: string, emoji: string) =>
    request<Message>(() => api.post(`/messages/${id}/reactions`, { emoji })),
  removeReaction: (id: string, emoji: string) =>
    request<Message>(() => api.delete(`/messages/${id}/reactions/${encodeURIComponent(emoji)}`)),
};
