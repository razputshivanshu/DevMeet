import type { Request, Response } from 'express';
import { organizationService } from './organization.service';
import { created, ok, noContent } from '../../core/utils/response';
import { UnauthorizedError } from '../../core/errors/app-error';

const uid = (req: Request) => {
  if (!req.user) throw new UnauthorizedError();
  return req.user.id;
};

export class OrganizationController {
  create = async (req: Request, res: Response) =>
    created(res, await organizationService.create(uid(req), req.body));

  list = async (req: Request, res: Response) =>
    ok(res, await organizationService.listForUser(uid(req)));

  get = async (req: Request, res: Response) =>
    ok(res, await organizationService.get(uid(req), req.params.organizationId));

  members = async (req: Request, res: Response) =>
    ok(res, await organizationService.listMembers(uid(req), req.params.organizationId));

  invite = async (req: Request, res: Response) =>
    created(res, await organizationService.invite(uid(req), req.params.organizationId, req.body));

  listInvites = async (req: Request, res: Response) =>
    ok(res, await organizationService.listInvites(uid(req), req.params.organizationId));

  acceptInvite = async (req: Request, res: Response) =>
    ok(res, await organizationService.acceptInvite(req.user!, req.body.token));

  updateMemberRole = async (req: Request, res: Response) =>
    ok(
      res,
      await organizationService.updateMemberRole(
        uid(req),
        req.params.organizationId,
        req.params.userId,
        req.body,
      ),
    );

  removeMember = async (req: Request, res: Response) => {
    await organizationService.removeMember(uid(req), req.params.organizationId, req.params.userId);
    return noContent(res);
  };
}

export const organizationController = new OrganizationController();
