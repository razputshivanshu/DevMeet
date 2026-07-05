import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '../../config/env';

export interface JwtPayload {
  sub: string; // user id
  email: string;
}

export const signJwt = (payload: JwtPayload): string => {
  const options: SignOptions = { expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'] };
  return jwt.sign(payload, env.JWT_SECRET, options);
};

export const verifyJwt = (token: string): JwtPayload => {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
};
