import { api, request } from '@/lib/api';
import type { User } from '@/types';

export const userService = {
  updateMe: (dto: { name?: string; bio?: string | null; avatarUrl?: string | null }) =>
    request<User>(() => api.patch('/users/me', dto)),
  getById: (id: string) => request<User>(() => api.get(`/users/${id}`)),
  search: (q: string) => request<User[]>(() => api.get('/users/search', { params: { q } })),
};

export const uploadService = {
  avatar: async (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    const { data } = await api.post('/uploads/avatar', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.data as { upload: { url: string }; user: User };
  },
  attachment: async (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    const { data } = await api.post('/uploads/attachment', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.data as {
      id: string;
      url: string;
      originalName: string;
      size: number;
      mimeType: string;
    };
  },
};
