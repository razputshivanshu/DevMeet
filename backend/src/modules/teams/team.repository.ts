import { prisma } from '../../config/prisma';
import type { Prisma, Team, TeamRole } from '@prisma/client';

export class TeamRepository {
  create(data: Prisma.TeamCreateInput): Promise<Team> {
    return prisma.team.create({ data });
  }

  update(id: string, data: Prisma.TeamUpdateInput): Promise<Team> {
    return prisma.team.update({ where: { id }, data });
  }

  findById(id: string) {
    return prisma.team.findUnique({
      where: { id },
      include: {
        organization: { select: { id: true, name: true, slug: true } },
        _count: { select: { members: true, channels: true, kanbanBoards: true } },
      },
    });
  }

  listForOrganization(organizationId: string, userId: string) {
    return prisma.team.findMany({
      where: {
        organizationId,
        OR: [
          { members: { some: { userId } } },
          { organization: { members: { some: { userId, role: { in: ['OWNER', 'ADMIN'] } } } } },
        ],
      },
      include: { _count: { select: { members: true, channels: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  listForUser(userId: string) {
    return prisma.team.findMany({
      where: { members: { some: { userId } } },
      include: {
        organization: { select: { id: true, name: true, slug: true } },
        _count: { select: { members: true, channels: true } },
      },
      orderBy: { updatedAt: 'desc' },
      take: 20,
    });
  }

  addMember(teamId: string, userId: string, role: TeamRole = 'MEMBER') {
    return prisma.teamMember.create({ data: { teamId, userId, role } });
  }

  removeMember(teamId: string, userId: string) {
    return prisma.teamMember.delete({ where: { teamId_userId: { teamId, userId } } });
  }

  getMembership(teamId: string, userId: string) {
    return prisma.teamMember.findUnique({ where: { teamId_userId: { teamId, userId } } });
  }

  listMembers(teamId: string) {
    return prisma.teamMember.findMany({
      where: { teamId },
      include: {
        user: { select: { id: true, email: true, username: true, name: true, avatarUrl: true } },
      },
      orderBy: { joinedAt: 'asc' },
    });
  }

  delete(id: string) {
    return prisma.team.delete({ where: { id } });
  }
}

export const teamRepository = new TeamRepository();
