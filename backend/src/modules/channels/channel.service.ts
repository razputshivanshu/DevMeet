import { channelRepository, ChannelRepository } from './channel.repository';
import { organizationRepository } from '../organizations/organization.repository';
import type { CreateChannelDto, UpdateChannelDto } from './channel.dto';
import { ConflictError, ForbiddenError, NotFoundError } from '../../core/errors/app-error';
import type { ChannelType } from '@prisma/client';

export class ChannelService {
  constructor(private readonly repo: ChannelRepository = channelRepository) {}

  async create(userId: string, dto: CreateChannelDto) {
    const orgMembership = await organizationRepository.getMembership(dto.organizationId, userId);
    if (!orgMembership) throw new ForbiddenError('Not a member of the organization');
    try {
      return await this.repo.create({
        name: dto.name,
        topic: dto.topic ?? undefined,
        type: dto.type as ChannelType,
        organization: { connect: { id: dto.organizationId } },
        team: dto.teamId ? { connect: { id: dto.teamId } } : undefined,
        createdBy: { connect: { id: userId } },
        members: { create: { userId } },
      });
    } catch (err: any) {
      if (err?.code === 'P2002') throw new ConflictError('Channel name already exists');
      throw err;
    }
  }

  async get(userId: string, id: string) {
    const channel = await this.repo.findById(id);
    if (!channel) throw new NotFoundError('Channel not found');
    await this.assertAccess(channel, userId);
    const membership = await this.repo.getMembership(id, userId);
    return { ...channel, isMember: !!membership };
  }

  async list(userId: string, organizationId?: string) {
    if (organizationId) {
      const m = await organizationRepository.getMembership(organizationId, userId);
      if (!m) throw new ForbiddenError('Not a member of the organization');
    }
    return this.repo.listForUser(userId, organizationId);
  }

  async update(userId: string, id: string, dto: UpdateChannelDto) {
    const channel = await this.repo.findById(id);
    if (!channel) throw new NotFoundError();
    await this.assertCanModify(channel, userId);
    return this.repo.update(id, dto);
  }

  async join(userId: string, id: string) {
    const channel = await this.repo.findById(id);
    if (!channel) throw new NotFoundError();
    if (channel.type === 'PRIVATE') throw new ForbiddenError('Cannot join private channel');
    const orgM = await organizationRepository.getMembership(channel.organizationId, userId);
    if (!orgM) throw new ForbiddenError();
    const existing = await this.repo.getMembership(id, userId);
    if (existing) return existing;
    return this.repo.addMember(id, userId);
  }

  async leave(userId: string, id: string) {
    const existing = await this.repo.getMembership(id, userId);
    if (!existing) throw new NotFoundError('Not a member');
    return this.repo.removeMember(id, userId);
  }

  async addMember(actingUserId: string, id: string, targetUserId: string) {
    const channel = await this.repo.findById(id);
    if (!channel) throw new NotFoundError();
    await this.assertCanModify(channel, actingUserId);
    const orgM = await organizationRepository.getMembership(channel.organizationId, targetUserId);
    if (!orgM) throw new ForbiddenError('User not in organization');
    const existing = await this.repo.getMembership(id, targetUserId);
    if (existing) throw new ConflictError('Already a member');
    return this.repo.addMember(id, targetUserId);
  }

  async removeMember(actingUserId: string, id: string, targetUserId: string) {
    const channel = await this.repo.findById(id);
    if (!channel) throw new NotFoundError();
    await this.assertCanModify(channel, actingUserId);
    return this.repo.removeMember(id, targetUserId);
  }

  async listMembers(userId: string, id: string) {
    const channel = await this.repo.findById(id);
    if (!channel) throw new NotFoundError();
    await this.assertAccess(channel, userId);
    return this.repo.listMembers(id);
  }

  async delete(userId: string, id: string) {
    const channel = await this.repo.findById(id);
    if (!channel) throw new NotFoundError();
    await this.assertCanModify(channel, userId);
    return this.repo.delete(id);
  }

  private async assertAccess(
    channel: { id: string; organizationId: string; type: ChannelType },
    userId: string,
  ) {
    const orgM = await organizationRepository.getMembership(channel.organizationId, userId);
    if (!orgM) throw new ForbiddenError('Not a member of the organization');
    if (channel.type === 'PRIVATE') {
      const m = await this.repo.getMembership(channel.id, userId);
      if (!m && orgM.role !== 'OWNER') throw new ForbiddenError('Private channel');
    }
  }

  private async assertCanModify(
    channel: { id: string; organizationId: string; createdById: string },
    userId: string,
  ) {
    const orgM = await organizationRepository.getMembership(channel.organizationId, userId);
    if (!orgM) throw new ForbiddenError();
    if (channel.createdById === userId) return;
    if (orgM.role === 'OWNER' || orgM.role === 'ADMIN') return;
    throw new ForbiddenError('Channel creator or org admin required');
  }
}

export const channelService = new ChannelService();
