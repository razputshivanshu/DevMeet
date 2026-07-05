import { prisma } from '../../config/prisma';
import { organizationRepository } from '../organizations/organization.repository';
import { ForbiddenError } from '../../core/errors/app-error';

/**
 * PostgreSQL full-text search across messages, channels, teams, and users
 * scoped to a single organization. Uses `search` mode + `plainto_tsquery`
 * semantics via Prisma's `mode: 'insensitive' contains` for portability
 * (works on any PG). For heavier workloads swap to tsvector + GIN index.
 */
export class SearchService {
  async searchAll(userId: string, organizationId: string, query: string) {
    const membership = await organizationRepository.getMembership(organizationId, userId);
    if (!membership) throw new ForbiddenError('Not a member of the organization');

    const q = query.trim();
    if (!q) return { messages: [], channels: [], teams: [], users: [] };
    const like = `%${q}%`;

    const [messages, channels, teams, users] = await Promise.all([
      prisma.$queryRaw<
        Array<{
          id: string;
          content: string;
          channelId: string;
          createdAt: Date;
          userName: string;
          username: string;
          channelName: string;
        }>
      >`
        SELECT m.id, m.content, m."channelId", m."createdAt",
               u.name AS "userName", u.username, c.name AS "channelName"
        FROM "Message" m
        JOIN "Channel" c ON c.id = m."channelId"
        JOIN "User" u ON u.id = m."userId"
        WHERE c."organizationId" = ${organizationId}
          AND m."deletedAt" IS NULL
          AND m.content ILIKE ${like}
        ORDER BY m."createdAt" DESC
        LIMIT 25
      `,
      prisma.channel.findMany({
        where: {
          organizationId,
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { topic: { contains: q, mode: 'insensitive' } },
          ],
        },
        take: 15,
        select: { id: true, name: true, topic: true, type: true, teamId: true },
      }),
      prisma.team.findMany({
        where: {
          organizationId,
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
          ],
        },
        take: 15,
        select: { id: true, name: true, description: true },
      }),
      prisma.user.findMany({
        where: {
          organizations: { some: { organizationId } },
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { username: { contains: q, mode: 'insensitive' } },
            { email: { contains: q, mode: 'insensitive' } },
          ],
        },
        take: 15,
        select: { id: true, name: true, username: true, avatarUrl: true, email: true },
      }),
    ]);

    return { messages, channels, teams, users };
  }
}

export const searchService = new SearchService();
