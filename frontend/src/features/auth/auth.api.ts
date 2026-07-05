import { api, request } from '@/lib/api';
import type { AuthResult, User } from '@/types';

export const authService = {
  register: (dto: { email: string; username: string; name: string; password: string }) =>
    request<AuthResult>(() => api.post('/auth/register', dto)),
  login: (dto: { email: string; password: string }) =>
    request<AuthResult>(() => api.post('/auth/login', dto)),
  me: () => request<User>(() => api.get('/auth/me')),
  forgotPassword: (email: string) =>
    request<{ sent: boolean; resetToken: string | null }>(() =>
      api.post('/auth/forgot-password', { email }),
    ),
  resetPassword: (dto: { token: string; password: string }) =>
    request<{ reset: boolean }>(() => api.post('/auth/reset-password', dto)),
};
