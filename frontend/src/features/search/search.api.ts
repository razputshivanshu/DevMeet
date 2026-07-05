import { api, request } from '@/lib/api';

export interface SearchResults {
  messages: Array<{
    id: string;
    content: string;
    channelId: string;
    channelName: string;
    userName: string;
    username: string;
    createdAt: string;
  }>;
  channels: Array<{
    id: string;
    name: string;
    topic: string | null;
    type: string;
    teamId: string | null;
  }>;
  teams: Array<{ id: string; name: string; description: string | null }>;
  users: Array<{
    id: string;
    name: string;
    username: string;
    email: string;
    avatarUrl: string | null;
  }>;
}

export const searchService = {
  searchAll: (organizationId: string, q: string) =>
    request<SearchResults>(() => api.get('/search', { params: { organizationId, q } })),
};
