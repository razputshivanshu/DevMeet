import { api, request } from '@/lib/api';
import type { KanbanBoard, KanbanCard, KanbanStatus } from '@/types';

export const kanbanService = {
  listBoards: (teamId: string) =>
    request<KanbanBoard[]>(() => api.get('/kanban/boards', { params: { teamId } })),
  getBoard: (id: string) => request<KanbanBoard>(() => api.get(`/kanban/boards/${id}`)),
  createBoard: (dto: { teamId: string; name: string; description?: string }) =>
    request<KanbanBoard>(() => api.post('/kanban/boards', dto)),
  createCard: (dto: {
    boardId: string;
    title: string;
    description?: string;
    status: KanbanStatus;
    assigneeId?: string;
  }) => request<KanbanCard>(() => api.post('/kanban/cards', dto)),
  updateCard: (id: string, dto: Partial<KanbanCard>) =>
    request<KanbanCard>(() => api.patch(`/kanban/cards/${id}`, dto)),
  moveCard: (id: string, dto: { status: KanbanStatus; position: number }) =>
    request<KanbanCard>(() => api.post(`/kanban/cards/${id}/move`, dto)),
  deleteCard: (id: string) => api.delete(`/kanban/cards/${id}`).then(() => true),
};
