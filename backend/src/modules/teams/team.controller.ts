import type { Request, Response } from 'express';
import { teamService } from './team.service';
import { created, noContent, ok } from '../../core/utils/response';
import { UnauthorizedError } from '../../core/errors/app-error';

const uid = (req: Request) => {
  if (!req.user) throw new UnauthorizedError();
  return req.user.id;
};

export class TeamController {
  create = async (req: Request, res: Response) =>
    created(res, await teamService.create(uid(req), req.body));
  update = async (req: Request, res: Response) =>
    ok(res, await teamService.update(uid(req), req.params.teamId, req.body));
  get = async (req: Request, res: Response) =>
    ok(res, await teamService.get(uid(req), req.params.teamId));
  listByOrg = async (req: Request, res: Response) =>
    ok(res, await teamService.listForOrganization(uid(req), String(req.query.organizationId)));
  listMine = async (req: Request, res: Response) => ok(res, await teamService.listMine(uid(req)));
  join = async (req: Request, res: Response) =>
    created(res, await teamService.join(uid(req), req.params.teamId));
  leave = async (req: Request, res: Response) => {
    await teamService.leave(uid(req), req.params.teamId);
    return noContent(res);
  };
  members = async (req: Request, res: Response) =>
    ok(res, await teamService.listMembers(uid(req), req.params.teamId));
  addMember = async (req: Request, res: Response) =>
    created(res, await teamService.addMember(uid(req), req.params.teamId, req.body));
  removeMember = async (req: Request, res: Response) => {
    await teamService.removeMember(uid(req), req.params.teamId, req.params.userId);
    return noContent(res);
  };
  delete = async (req: Request, res: Response) => {
    await teamService.delete(uid(req), req.params.teamId);
    return noContent(res);
  };
}

export const teamController = new TeamController();
