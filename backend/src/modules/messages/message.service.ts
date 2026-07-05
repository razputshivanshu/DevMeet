import { MessageType } from '@prisma/client';
import { messageRepository, MessageRepository } from './message.repository';
import { channelRepository } from '../channels/channel.repository';
import { organizationRepository } from '../organizations/organization.repository';
import type { CreateMessageDto } from './message.dto';
import { ForbiddenError, NotFoundError } from '../../core/errors/app-error';
import { getIO } from '../../core/socket/socket';

export class MessageService {
  constructor(private readonly repo: MessageRepository = messageRepository) {}

  async create(userId: string, dto: CreateMessageDto) {
    const channel = await channelRepository.findById(dto.channelId);
    if (!channel) throw new NotFoundError('Channel not found');
    await this.assertChannelAccess(channel, userId);

    const msg = await this.repo.create({
      channel: { connect: { id: dto.channelId } },
      user: { connect: { id: userId } },
      content: dto.content,
      type: dto.fileUrl ? MessageType.FILE : MessageType.TEXT,
      fileUrl: dto.fileUrl ?? undefined,
      fileName: dto.fileName ?? undefined,
      fileSize: dto.fileSize ?? undefined,
    });

    getIO().to(`channel:${dto.channelId}`).emit('message:new', msg);
    return msg;
  }

  async list(userId: string, channelId: string, cursor?: string, limit = 50) {
    const channel = await channelRepository.findById(channelId);
    if (!channel) throw new NotFoundError();
    await this.assertChannelAccess(channel, userId);
    const items = await this.repo.list(channelId, cursor, limit);
    const nextCursor = items.length === limit ? items[items.length - 1].id : null;
    return { items: items.reverse(), nextCursor };
  }

  async delete(userId: string, id: string) {
    const msg = await this.repo.findById(id);
    if (!msg) throw new NotFoundError();
    const channel = await channelRepository.findById(msg.channelId);
    if (!channel) throw new NotFoundError();
    // Author OR org admin/owner can delete.
    if (msg.userId !== userId) {
      const orgM = await organizationRepository.getMembership(channel.organizationId, userId);
      if (!orgM || (orgM.role !== 'OWNER' && orgM.role !== 'ADMIN')) {
        throw new ForbiddenError('Only the author or an admin can delete');
      }
    }
    const deleted = await this.repo.softDelete(id);
    getIO()
      .to(`channel:${msg.channelId}`)
      .emit('message:deleted', { id, channelId: msg.channelId });
    return deleted;
  }

  async addReaction(userId: string, messageId: string, emoji: string) {
    const msg = await this.repo.findById(messageId);
    if (!msg) throw new NotFoundError();
    const channel = await channelRepository.findById(msg.channelId);
    if (!channel) throw new NotFoundError();
    await this.assertChannelAccess(channel, userId);
    try {
      await this.repo.addReaction(messageId, userId, emoji);
    } catch (err: any) {
      if (err?.code !== 'P2002') throw err; // idempotent on unique-violation
    }
    const updated = await this.repo.findById(messageId);
    getIO().to(`channel:${msg.channelId}`).emit('message:updated', updated);
    return updated;
  }

  async removeReaction(userId: string, messageId: string, emoji: string) {
    const msg = await this.repo.findById(messageId);
    if (!msg) throw new NotFoundError();
    await this.repo.removeReaction(messageId, userId, emoji);
    const updated = await this.repo.findById(messageId);
    getIO().to(`channel:${msg.channelId}`).emit('message:updated', updated);
    return updated;
  }

  private async assertChannelAccess(
    channel: { id: string; organizationId: string; type: 'PUBLIC' | 'PRIVATE' | 'DIRECT' },
    userId: string,
  ) {
    const orgM = await organizationRepository.getMembership(channel.organizationId, userId);
    if (!orgM) throw new ForbiddenError('Not a member of the organization');
    if (channel.type !== 'PUBLIC') {
      const m = await channelRepository.getMembership(channel.id, userId);
      if (!m && orgM.role !== 'OWNER') throw new ForbiddenError('Not in this channel');
    }
  }
}

export const messageService = new MessageService();
