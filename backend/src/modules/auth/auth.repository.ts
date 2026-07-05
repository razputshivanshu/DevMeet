import { prisma } from '../../config/prisma';
import type { Prisma, User, PasswordResetToken } from '@prisma/client';

/**
 * Auth-specific persistence gateway. Isolates Prisma access from services so
 * repositories can be swapped without touching business logic.
 */
export class AuthRepository {
  findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email } });
  }

  findByUsername(username: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { username } });
  }

  findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } });
  }

  create(data: Prisma.UserCreateInput): Promise<User> {
    return prisma.user.create({ data });
  }

  createResetToken(userId: string, token: string, expiresAt: Date): Promise<PasswordResetToken> {
    return prisma.passwordResetToken.create({ data: { userId, token, expiresAt } });
  }

  findResetToken(token: string): Promise<PasswordResetToken | null> {
    return prisma.passwordResetToken.findUnique({ where: { token } });
  }

  markResetTokenUsed(id: string) {
    return prisma.passwordResetToken.update({ where: { id }, data: { used: true } });
  }

  updatePassword(userId: string, hash: string): Promise<User> {
    return prisma.user.update({ where: { id: userId }, data: { password: hash } });
  }
}

export const authRepository = new AuthRepository();
