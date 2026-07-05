import type { Response } from 'express';

export const ok = <T>(res: Response, data: T, status = 200) =>
  res.status(status).json({ success: true, data });

export const created = <T>(res: Response, data: T) => ok(res, data, 201);

export const noContent = (res: Response) => res.status(204).send();
