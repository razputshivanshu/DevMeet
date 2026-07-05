import { prisma } from '../../config/prisma';
import type { Message, MessageReaction, Prisma } from '@prisma/client';

const messageInclude = {
  user: { select: { id: true, username: true, name: true, avatarUrl: true } },
  reactions: {
    include: {
      user: { select: { id: true, username: true, name: true } },
    },
  },
} satisfies Prisma.MessageInclude;

export type MessageWithRelations = Prisma.MessageGetPayload<{ include: typeof messageInclude }>;

export class MessageRepository {
  static readonly include = messageInclude;

  create(data: Prisma.MessageCreateInput): Promise<MessageWithRelations> {
    return prisma.message.create({ data, include: messageInclude });
  }

  findById(id: string): Promise<MessageWithRelations | null> {
    return prisma.message.findUnique({ where: { id }, include: messageInclude });
  }

  list(channelId: string, cursor?: string, limit = 50): Promise<MessageWithRelations[]> {
    return prisma.message.findMany({
      where: { channelId, deletedAt: null },
      include: messageInclude,
      orderBy: { createdAt: 'desc' },
      take: limit,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    });
  }

  softDelete(id: string): Promise<Message> {
    return prisma.message.update({
      where: { id },
      data: { deletedAt: new Date(), content: '[deleted]' },
    });
  }

  addReaction(messageId: string, userId: string, emoji: string): Promise<MessageReaction> {
    return prisma.messageReaction.create({ data: { messageId, userId, emoji } });
  }

  removeReaction(messageId: string, userId: string, emoji: string) {
    return prisma.messageReaction.deleteMany({ where: { messageId, userId, emoji } });
  }
}

export const messageRepository = new MessageRepository();
