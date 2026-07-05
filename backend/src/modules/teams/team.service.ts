import { teamRepository, TeamRepository } from './team.repository';
import { organizationRepository } from '../organizations/organization.repository';
import type { AddTeamMemberDto, CreateTeamDto, UpdateTeamDto } from './team.dto';
import { ConflictError, ForbiddenError, NotFoundError } from '../../core/errors/app-error';
import type { TeamRole } from '@prisma/client';

export class TeamService {
  constructor(private readonly repo: TeamRepository = teamRepository) {}

  async create(userId: string, dto: CreateTeamDto) {
    const membership = await organizationRepository.getMembership(dto.organizationId, userId);
    if (!membership) throw new ForbiddenError('Not a member of the organization');
    return this.repo.create({
      name: dto.name,
      description: dto.description ?? undefined,
      organization: { connect: { id: dto.organizationId } },
      createdBy: { connect: { id: userId } },
      members: { create: { userId, role: 'LEAD' } },
    });
  }

  async update(userId: string, id: string, dto: UpdateTeamDto) {
    await this.ensureLead(id, userId);
    return this.repo.update(id, dto);
  }

  async get(userId: string, id: string) {
    const team = await this.repo.findById(id);
    if (!team) throw new NotFoundError('Team not found');
    const orgMembership = await organizationRepository.getMembership(team.organizationId, userId);
    if (!orgMembership) throw new ForbiddenError('Not a member of the organization');
    const teamMembership = await this.repo.getMembership(id, userId);
    return { ...team, myRole: teamMembership?.role ?? null, isMember: !!teamMembership };
  }

  async listForOrganization(userId: string, organizationId: string) {
    const orgMembership = await organizationRepository.getMembership(organizationId, userId);
    if (!orgMembership) throw new ForbiddenError('Not a member');
    return this.repo.listForOrganization(organizationId, userId);
  }

  async listMine(userId: string) {
    return this.repo.listForUser(userId);
  }

  async join(userId: string, id: string) {
    const team = await this.repo.findById(id);
    if (!team) throw new NotFoundError('Team not found');
    const orgMembership = await organizationRepository.getMembership(team.organizationId, userId);
    if (!orgMembership) throw new ForbiddenError('Not a member of the organization');
    const existing = await this.repo.getMembership(id, userId);
    if (existing) throw new ConflictError('Already a member');
    return this.repo.addMember(id, userId);
  }

  async leave(userId: string, id: string) {
    const existing = await this.repo.getMembership(id, userId);
    if (!existing) throw new NotFoundError('Not a member');
    return this.repo.removeMember(id, userId);
  }

  async listMembers(userId: string, id: string) {
    const team = await this.repo.findById(id);
    if (!team) throw new NotFoundError('Team not found');
    const orgMembership = await organizationRepository.getMembership(team.organizationId, userId);
    if (!orgMembership) throw new ForbiddenError();
    return this.repo.listMembers(id);
  }

  async addMember(actingUserId: string, id: string, dto: AddTeamMemberDto) {
    await this.ensureLead(id, actingUserId);
    const existing = await this.repo.getMembership(id, dto.userId);
    if (existing) throw new ConflictError('Already a member');
    return this.repo.addMember(id, dto.userId, dto.role as TeamRole);
  }

  async removeMember(actingUserId: string, id: string, targetUserId: string) {
    await this.ensureLead(id, actingUserId);
    return this.repo.removeMember(id, targetUserId);
  }

  async delete(userId: string, id: string) {
    await this.ensureLead(id, userId);
    return this.repo.delete(id);
  }

  private async ensureLead(teamId: string, userId: string) {
    const m = await this.repo.getMembership(teamId, userId);
    if (!m || m.role !== 'LEAD') {
      // Org owners/admins are also allowed.
      const team = await this.repo.findById(teamId);
      if (!team) throw new NotFoundError('Team not found');
      const orgM = await organizationRepository.getMembership(team.organizationId, userId);
      if (!orgM || (orgM.role !== 'OWNER' && orgM.role !== 'ADMIN')) {
        throw new ForbiddenError('Team lead or organization admin required');
      }
    }
  }
}

export const teamService = new TeamService();
