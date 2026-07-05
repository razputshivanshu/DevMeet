import crypto from 'crypto';
import { AuthProvider, type User } from '@prisma/client';
import { authRepository, AuthRepository } from './auth.repository';
import type { LoginDto, RegisterDto, ResetPasswordDto } from './auth.dto';
import { comparePassword, hashPassword } from '../../core/utils/password';
import { signJwt } from '../../core/utils/jwt';
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
  UnauthorizedError,
} from '../../core/errors/app-error';

export interface AuthResult {
  token: string;
  user: PublicUser;
}

export interface PublicUser {
  id: string;
  email: string;
  username: string;
  name: string;
  avatarUrl: string | null;
  bio: string | null;
  provider: AuthProvider;
}

export const toPublicUser = (u: User): PublicUser => ({
  id: u.id,
  email: u.email,
  username: u.username,
  name: u.name,
  avatarUrl: u.avatarUrl,
  bio: u.bio,
  provider: u.provider,
});

export class AuthService {
  constructor(private readonly repo: AuthRepository = authRepository) {}

  async register(dto: RegisterDto): Promise<AuthResult> {
    const [existingEmail, existingUsername] = await Promise.all([
      this.repo.findByEmail(dto.email),
      this.repo.findByUsername(dto.username),
    ]);
    if (existingEmail) throw new ConflictError('Email already registered');
    if (existingUsername) throw new ConflictError('Username already taken');

    const hash = await hashPassword(dto.password);
    const user = await this.repo.create({
      email: dto.email,
      username: dto.username,
      name: dto.name,
      password: hash,
      provider: AuthProvider.LOCAL,
      emailVerified: false,
    });
    return this.issueToken(user);
  }

  async login(dto: LoginDto): Promise<AuthResult> {
    const user = await this.repo.findByEmail(dto.email);
    if (!user || !user.password) throw new UnauthorizedError('Invalid credentials');
    if (!user.isActive) throw new UnauthorizedError('Account disabled');
    const valid = await comparePassword(dto.password, user.password);
    if (!valid) throw new UnauthorizedError('Invalid credentials');
    return this.issueToken(user);
  }

  async me(userId: string): Promise<PublicUser> {
    const user = await this.repo.findById(userId);
    if (!user) throw new NotFoundError('User not found');
    return toPublicUser(user);
  }

  async requestPasswordReset(email: string): Promise<{ resetToken: string | null }> {
    const user = await this.repo.findByEmail(email);
    // Avoid user enumeration: always return success but only mint token if user exists.
    if (!user) return { resetToken: null };
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1h
    await this.repo.createResetToken(user.id, token, expiresAt);
    // In production this would be emailed. For MVP we return it so the caller can display or email it.
    return { resetToken: token };
  }

  async resetPassword(dto: ResetPasswordDto): Promise<void> {
    const record = await this.repo.findResetToken(dto.token);
    if (!record) throw new BadRequestError('Invalid reset token');
    if (record.used) throw new BadRequestError('Reset token already used');
    if (record.expiresAt < new Date()) throw new BadRequestError('Reset token expired');

    const hash = await hashPassword(dto.password);
    await this.repo.updatePassword(record.userId, hash);
    await this.repo.markResetTokenUsed(record.id);
  }

  /**
   * Login-or-create flow used by OAuth callbacks.
   */
  async loginOrCreateOAuth(params: {
    email: string;
    name: string;
    providerId: string;
    avatarUrl?: string;
  }): Promise<AuthResult> {
    let user = await this.repo.findByEmail(params.email);
    if (!user) {
      // Generate a unique username from email
      const base =
        params.email
          .split('@')[0]
          .replace(/[^a-zA-Z0-9_.-]/g, '')
          .slice(0, 20) || 'user';
      let username = base;
      let attempt = 0;
      // eslint-disable-next-line no-await-in-loop
      while (await this.repo.findByUsername(username)) {
        attempt += 1;
        username = `${base}${attempt}`;
      }
      user = await this.repo.create({
        email: params.email,
        username,
        name: params.name,
        avatarUrl: params.avatarUrl,
        provider: AuthProvider.GOOGLE,
        providerId: params.providerId,
        emailVerified: true,
      });
    }
    return this.issueToken(user);
  }

  private issueToken(user: User): AuthResult {
    const token = signJwt({ sub: user.id, email: user.email });
    return { token, user: toPublicUser(user) };
  }
}

export const authService = new AuthService();
