import { prisma } from '../../config/prisma';
import type { Channel, ChannelMember, ChannelType, Prisma } from '@prisma/client';

export class ChannelRepository {
  create(data: Prisma.ChannelCreateInput): Promise<Channel> {
    return prisma.channel.create({ data });
  }

  update(id: string, data: Prisma.ChannelUpdateInput): Promise<Channel> {
    return prisma.channel.update({ where: { id }, data });
  }

  findById(id: string) {
    return prisma.channel.findUnique({
      where: { id },
      include: {
        organization: { select: { id: true, name: true, slug: true } },
        team: { select: { id: true, name: true } },
        _count: { select: { members: true, messages: true } },
      },
    });
  }

  listForUser(userId: string, organizationId?: string) {
    return prisma.channel.findMany({
      where: {
        AND: [
          organizationId ? { organizationId } : {},
          {
            OR: [
              { type: 'PUBLIC', organization: { members: { some: { userId } } } },
              { members: { some: { userId } } },
            ],
          },
        ],
      },
      include: {
        team: { select: { id: true, name: true } },
        _count: { select: { messages: true, members: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  addMember(channelId: string, userId: string) {
    return prisma.channelMember.create({ data: { channelId, userId } });
  }

  removeMember(channelId: string, userId: string) {
    return prisma.channelMember.delete({ where: { channelId_userId: { channelId, userId } } });
  }

  getMembership(channelId: string, userId: string): Promise<ChannelMember | null> {
    return prisma.channelMember.findUnique({ where: { channelId_userId: { channelId, userId } } });
  }

  listMembers(channelId: string) {
    return prisma.channelMember.findMany({
      where: { channelId },
      include: {
        user: { select: { id: true, username: true, name: true, avatarUrl: true, email: true } },
      },
    });
  }

  delete(id: string) {
    return prisma.channel.delete({ where: { id } });
  }

  updateType(id: string, type: ChannelType) {
    return prisma.channel.update({ where: { id }, data: { type } });
  }
}

export const channelRepository = new ChannelRepository();
