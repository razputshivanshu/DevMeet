import crypto from 'crypto';
import { MeetingStatus } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { organizationRepository } from '../organizations/organization.repository';
import type { CreateMeetingDto } from './meeting.dto';
import { ForbiddenError, NotFoundError } from '../../core/errors/app-error';

/**
 * Meetings are lightweight — the actual audio/video/screen-share is negotiated
 * client-side via WebRTC using the socket signalling channel.
 */
export class MeetingService {
  async create(userId: string, dto: CreateMeetingDto) {
    const m = await organizationRepository.getMembership(dto.organizationId, userId);
    if (!m) throw new ForbiddenError('Not a member of the organization');
    const roomCode = crypto.randomBytes(4).toString('hex'); // 8-char code
    return prisma.meeting.create({
      data: {
        organizationId: dto.organizationId,
        title: dto.title,
        roomCode,
        createdById: userId,
        status: MeetingStatus.LIVE,
        startedAt: new Date(),
      },
    });
  }

  async getByCode(userId: string, roomCode: string) {
    const meeting = await prisma.meeting.findUnique({
      where: { roomCode },
      include: {
        organization: { select: { id: true, name: true, slug: true } },
        createdBy: { select: { id: true, username: true, name: true, avatarUrl: true } },
        participants: {
          include: {
            user: { select: { id: true, username: true, name: true, avatarUrl: true } },
          },
        },
      },
    });
    if (!meeting) throw new NotFoundError('Meeting not found');
    const m = await organizationRepository.getMembership(meeting.organizationId, userId);
    if (!m) throw new ForbiddenError('Not a member of the organization');
    return meeting;
  }

  async list(userId: string, organizationId: string) {
    const m = await organizationRepository.getMembership(organizationId, userId);
    if (!m) throw new ForbiddenError();
    return prisma.meeting.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        createdBy: { select: { id: true, username: true, name: true, avatarUrl: true } },
        _count: { select: { participants: true } },
      },
    });
  }

  async join(userId: string, roomCode: string) {
    const meeting = await this.getByCode(userId, roomCode);
    await prisma.meetingParticipant.upsert({
      where: { meetingId_userId: { meetingId: meeting.id, userId } },
      update: { leftAt: null, joinedAt: new Date() },
      create: { meetingId: meeting.id, userId },
    });
    return this.getByCode(userId, roomCode);
  }

  async leave(userId: string, roomCode: string) {
    const meeting = await prisma.meeting.findUnique({ where: { roomCode } });
    if (!meeting) throw new NotFoundError();
    await prisma.meetingParticipant
      .update({
        where: { meetingId_userId: { meetingId: meeting.id, userId } },
        data: { leftAt: new Date() },
      })
      .catch(() => undefined);
    return { left: true };
  }

  async end(userId: string, roomCode: string) {
    const meeting = await prisma.meeting.findUnique({ where: { roomCode } });
    if (!meeting) throw new NotFoundError();
    if (meeting.createdById !== userId) {
      const m = await organizationRepository.getMembership(meeting.organizationId, userId);
      if (!m || (m.role !== 'OWNER' && m.role !== 'ADMIN'))
        throw new ForbiddenError('Only host or admin can end');
    }
    return prisma.meeting.update({
      where: { id: meeting.id },
      data: { status: MeetingStatus.ENDED, endedAt: new Date() },
    });
  }
}

export const meetingService = new MeetingService();
