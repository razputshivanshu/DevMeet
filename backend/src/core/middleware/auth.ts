import type { NextFunction, Request, Response } from 'express';
import { UnauthorizedError, ForbiddenError } from '../errors/app-error';
import { verifyJwt } from '../utils/jwt';
import { prisma } from '../../config/prisma';

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  name: string;
  avatarUrl: string | null;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

/**
 * Verifies Bearer JWT, loads the user, and attaches it to `req.user`.
 */
export const requireAuth = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      throw new UnauthorizedError('Missing bearer token');
    }
    const token = header.slice(7);
    const payload = verifyJwt(token);

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        avatarUrl: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) throw new UnauthorizedError('Invalid or inactive user');

    req.user = {
      id: user.id,
      email: user.email,
      username: user.username,
      name: user.name,
      avatarUrl: user.avatarUrl,
    };
    next();
  } catch (err) {
    if (err instanceof UnauthorizedError) return next(err);
    next(new UnauthorizedError('Invalid or expired token'));
  }
};

/**
 * Ensures the authenticated user has one of the required roles inside a given organization.
 * organizationId is read from req.params[paramName] (default: 'organizationId').
 */
export const requireOrgRole =
  (roles: Array<'OWNER' | 'ADMIN' | 'MEMBER'>, paramName = 'organizationId') =>
  async (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new UnauthorizedError();
      const organizationId = req.params[paramName];
      if (!organizationId) throw new ForbiddenError('Organization id missing');
      const membership = await prisma.organizationMember.findUnique({
        where: { organizationId_userId: { organizationId, userId: req.user.id } },
      });
      if (!membership) throw new ForbiddenError('Not a member of this organization');
      if (!roles.includes(membership.role)) {
        throw new ForbiddenError(`Requires one of: ${roles.join(', ')}`);
      }
      next();
    } catch (err) {
      next(err);
    }
  };
