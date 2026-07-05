import crypto from 'crypto';
import { OrgRole } from '@prisma/client';
import { organizationRepository, OrganizationRepository } from './organization.repository';
import type { AuthUser } from '../../core/middleware/auth';
import type {
  CreateOrganizationDto,
  InviteMemberDto,
  UpdateMemberRoleDto,
} from './organization.dto';
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from '../../core/errors/app-error';

export class OrganizationService {
  constructor(private readonly repo: OrganizationRepository = organizationRepository) {}

  async create(userId: string, dto: CreateOrganizationDto) {
    const existing = await this.repo.findBySlug(dto.slug);
    if (existing) throw new ConflictError('Slug already taken');
    return this.repo.create({
      name: dto.name,
      slug: dto.slug,
      description: dto.description ?? undefined,
      createdBy: { connect: { id: userId } },
      members: { create: { userId, role: OrgRole.OWNER } },
    });
  }

  listForUser(userId: string) {
    return this.repo.listForUser(userId);
  }

  async get(userId: string, id: string) {
    const org = await this.repo.findById(id);
    if (!org) throw new NotFoundError('Organization not found');
    const membership = await this.repo.getMembership(id, userId);
    if (!membership) throw new ForbiddenError('Not a member');
    return { ...org, myRole: membership.role };
  }

  async listMembers(userId: string, organizationId: string) {
    await this.ensureMember(organizationId, userId);
    return this.repo.listMembers(organizationId);
  }

  async invite(userId: string, organizationId: string, dto: InviteMemberDto) {
    await this.ensureRole(organizationId, userId, ['OWNER', 'ADMIN']);
    const token = crypto.randomBytes(24).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7d
    return this.repo.createInvite({
      email: dto.email,
      role: dto.role as OrgRole,
      token,
      expiresAt,
      organization: { connect: { id: organizationId } },
      invitedBy: { connect: { id: userId } },
    });
  }

  async listInvites(userId: string, organizationId: string) {
    await this.ensureRole(organizationId, userId, ['OWNER', 'ADMIN']);
    return this.repo.listInvites(organizationId);
  }

  async acceptInvite(user: AuthUser, token: string) {
    const invite = await this.repo.findInviteByToken(token);
    if (!invite) throw new BadRequestError('Invalid invite token');
    if (invite.acceptedAt) throw new BadRequestError('Invite already accepted');
    if (invite.expiresAt < new Date()) throw new BadRequestError('Invite expired');
    if (invite.email.toLowerCase() !== user.email.toLowerCase()) {
      throw new ForbiddenError('Invite does not match the authenticated user');
    }

    const existing = await this.repo.getMembership(invite.organizationId, user.id);
    if (existing) {
      await this.repo.markInviteAccepted(invite.id);
      return this.repo.findById(invite.organizationId);
    }

    await this.repo.addMember(invite.organizationId, user.id, invite.role);
    await this.repo.markInviteAccepted(invite.id);
    return this.repo.findById(invite.organizationId);
  }

  async updateMemberRole(
    actingUserId: string,
    organizationId: string,
    targetUserId: string,
    dto: UpdateMemberRoleDto,
  ) {
    await this.ensureRole(organizationId, actingUserId, ['OWNER']);
    const target = await this.repo.getMembership(organizationId, targetUserId);
    if (!target) throw new NotFoundError('Member not found');
    return this.repo.updateMemberRole(organizationId, targetUserId, dto.role as OrgRole);
  }

  async removeMember(actingUserId: string, organizationId: string, targetUserId: string) {
    await this.ensureRole(organizationId, actingUserId, ['OWNER', 'ADMIN']);
    const target = await this.repo.getMembership(organizationId, targetUserId);
    if (!target) return null;
    if (target.role === OrgRole.OWNER) throw new ForbiddenError('Cannot remove owner');
    return this.repo.removeMember(organizationId, targetUserId);
  }

  private async ensureMember(organizationId: string, userId: string) {
    const m = await this.repo.getMembership(organizationId, userId);
    if (!m) throw new ForbiddenError('Not a member of this organization');
    return m;
  }

  private async ensureRole(
    organizationId: string,
    userId: string,
    roles: Array<OrgRole | 'OWNER' | 'ADMIN' | 'MEMBER'>,
  ) {
    const m = await this.ensureMember(organizationId, userId);
    if (!roles.includes(m.role)) {
      throw new ForbiddenError(`Requires one of: ${roles.join(', ')}`);
    }
    return m;
  }
}

export const organizationService = new OrganizationService();
