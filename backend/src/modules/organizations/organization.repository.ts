import { prisma } from '../../config/prisma';
import type {
  Organization,
  OrganizationInvite,
  OrganizationMember,
  OrgRole,
  Prisma,
} from '@prisma/client';

export class OrganizationRepository {
  create(data: Prisma.OrganizationCreateInput): Promise<Organization> {
    return prisma.organization.create({ data });
  }

  findById(id: string): Promise<Organization | null> {
    return prisma.organization.findUnique({ where: { id } });
  }

  findBySlug(slug: string): Promise<Organization | null> {
    return prisma.organization.findUnique({ where: { slug } });
  }

  listForUser(userId: string) {
    return prisma.organization.findMany({
      where: { members: { some: { userId } } },
      include: {
        _count: { select: { members: true, teams: true, channels: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  listMembers(organizationId: string) {
    return prisma.organizationMember.findMany({
      where: { organizationId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            name: true,
            avatarUrl: true,
            lastSeenAt: true,
          },
        },
      },
      orderBy: { joinedAt: 'asc' },
    });
  }

  getMembership(organizationId: string, userId: string): Promise<OrganizationMember | null> {
    return prisma.organizationMember.findUnique({
      where: { organizationId_userId: { organizationId, userId } },
    });
  }

  addMember(organizationId: string, userId: string, role: OrgRole = 'MEMBER') {
    return prisma.organizationMember.create({ data: { organizationId, userId, role } });
  }

  updateMemberRole(organizationId: string, userId: string, role: OrgRole) {
    return prisma.organizationMember.update({
      where: { organizationId_userId: { organizationId, userId } },
      data: { role },
    });
  }

  removeMember(organizationId: string, userId: string) {
    return prisma.organizationMember.delete({
      where: { organizationId_userId: { organizationId, userId } },
    });
  }

  createInvite(data: Prisma.OrganizationInviteCreateInput): Promise<OrganizationInvite> {
    return prisma.organizationInvite.create({ data });
  }

  findInviteByToken(token: string): Promise<OrganizationInvite | null> {
    return prisma.organizationInvite.findUnique({ where: { token } });
  }

  markInviteAccepted(id: string) {
    return prisma.organizationInvite.update({ where: { id }, data: { acceptedAt: new Date() } });
  }

  listInvites(organizationId: string) {
    return prisma.organizationInvite.findMany({
      where: { organizationId, acceptedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }
}

export const organizationRepository = new OrganizationRepository();
