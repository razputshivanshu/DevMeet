import { prisma } from '../../config/prisma';
import type { Prisma, User } from '@prisma/client';

export class UserRepository {
  findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } });
  }

  findMany(ids: string[]): Promise<User[]> {
    return prisma.user.findMany({ where: { id: { in: ids } } });
  }

  update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
    return prisma.user.update({ where: { id }, data });
  }

  searchByQuery(query: string, excludeUserId?: string, limit = 20): Promise<User[]> {
    return prisma.user.findMany({
      where: {
        AND: [
          excludeUserId ? { id: { not: excludeUserId } } : {},
          {
            OR: [
              { username: { contains: query, mode: 'insensitive' } },
              { name: { contains: query, mode: 'insensitive' } },
              { email: { contains: query, mode: 'insensitive' } },
            ],
          },
        ],
      },
      take: limit,
      orderBy: { username: 'asc' },
    });
  }
}

export const userRepository = new UserRepository();
