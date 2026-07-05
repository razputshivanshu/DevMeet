import { KanbanStatus } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { teamRepository } from '../teams/team.repository';
import type { CreateBoardDto, CreateCardDto, MoveCardDto, UpdateCardDto } from './kanban.dto';
import { ForbiddenError, NotFoundError } from '../../core/errors/app-error';

export class KanbanService {
  async createBoard(userId: string, dto: CreateBoardDto) {
    await this.ensureTeamMember(dto.teamId, userId);
    return prisma.kanbanBoard.create({
      data: {
        teamId: dto.teamId,
        name: dto.name,
        description: dto.description ?? undefined,
      },
    });
  }

  async listBoards(userId: string, teamId: string) {
    await this.ensureTeamMember(teamId, userId);
    return prisma.kanbanBoard.findMany({
      where: { teamId },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { cards: true } } },
    });
  }

  async getBoard(userId: string, boardId: string) {
    const board = await prisma.kanbanBoard.findUnique({
      where: { id: boardId },
      include: {
        team: { select: { id: true, name: true, organizationId: true } },
        cards: {
          orderBy: [{ status: 'asc' }, { position: 'asc' }],
          include: {
            assignee: { select: { id: true, name: true, username: true, avatarUrl: true } },
            createdBy: { select: { id: true, name: true, username: true, avatarUrl: true } },
          },
        },
      },
    });
    if (!board) throw new NotFoundError('Board not found');
    await this.ensureTeamMember(board.teamId, userId);
    return board;
  }

  async deleteBoard(userId: string, boardId: string) {
    const board = await prisma.kanbanBoard.findUnique({ where: { id: boardId } });
    if (!board) throw new NotFoundError();
    await this.ensureTeamMember(board.teamId, userId);
    return prisma.kanbanBoard.delete({ where: { id: boardId } });
  }

  async createCard(userId: string, dto: CreateCardDto) {
    const board = await prisma.kanbanBoard.findUnique({ where: { id: dto.boardId } });
    if (!board) throw new NotFoundError('Board not found');
    await this.ensureTeamMember(board.teamId, userId);

    const position = await prisma.kanbanCard.count({
      where: { boardId: dto.boardId, status: dto.status as KanbanStatus },
    });
    return prisma.kanbanCard.create({
      data: {
        boardId: dto.boardId,
        title: dto.title,
        description: dto.description ?? undefined,
        status: dto.status as KanbanStatus,
        position,
        assigneeId: dto.assigneeId ?? undefined,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        createdById: userId,
      },
      include: {
        assignee: { select: { id: true, name: true, username: true, avatarUrl: true } },
        createdBy: { select: { id: true, name: true, username: true, avatarUrl: true } },
      },
    });
  }

  async updateCard(userId: string, cardId: string, dto: UpdateCardDto) {
    const card = await prisma.kanbanCard.findUnique({
      where: { id: cardId },
      include: { board: true },
    });
    if (!card) throw new NotFoundError();
    await this.ensureTeamMember(card.board.teamId, userId);
    return prisma.kanbanCard.update({
      where: { id: cardId },
      data: {
        title: dto.title ?? undefined,
        description: dto.description ?? undefined,
        status: (dto.status as KanbanStatus) ?? undefined,
        position: dto.position ?? undefined,
        assigneeId: dto.assigneeId === undefined ? undefined : dto.assigneeId,
        dueDate: dto.dueDate === undefined ? undefined : dto.dueDate ? new Date(dto.dueDate) : null,
      },
      include: {
        assignee: { select: { id: true, name: true, username: true, avatarUrl: true } },
        createdBy: { select: { id: true, name: true, username: true, avatarUrl: true } },
      },
    });
  }

  async moveCard(userId: string, cardId: string, dto: MoveCardDto) {
    return this.updateCard(userId, cardId, {
      status: dto.status,
      position: dto.position,
    });
  }

  async deleteCard(userId: string, cardId: string) {
    const card = await prisma.kanbanCard.findUnique({
      where: { id: cardId },
      include: { board: true },
    });
    if (!card) throw new NotFoundError();
    await this.ensureTeamMember(card.board.teamId, userId);
    return prisma.kanbanCard.delete({ where: { id: cardId } });
  }

  private async ensureTeamMember(teamId: string, userId: string) {
    const membership = await teamRepository.getMembership(teamId, userId);
    if (membership) return;
    // Org owners/admins can access
    const team = await teamRepository.findById(teamId);
    if (!team) throw new NotFoundError('Team not found');
    const orgM = await prisma.organizationMember.findUnique({
      where: { organizationId_userId: { organizationId: team.organizationId, userId } },
    });
    if (!orgM || (orgM.role !== 'OWNER' && orgM.role !== 'ADMIN')) {
      throw new ForbiddenError('Not a team member');
    }
  }
}

export const kanbanService = new KanbanService();
