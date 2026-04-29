import {Request, Response, NextFunction} from 'express';
import jwt from 'jsonwebtoken';
import {env} from '../config/env';
import {ApiError} from '../utils/error';

const ACCESS_COOKIE = 'dc_access_token';

export type JwtPayload = {
  userId: string;
  type?: 'user' | 'admin';
};

declare global {
  namespace Express {
    interface Request {
      auth?: JwtPayload;
    }
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  let token: string | undefined;

  if (header) {
    const [scheme, value] = header.split(' ');
    if (scheme === 'Bearer' && value) {
      token = value;
    }
  }

  if (!token) {
    token = req.cookies?.[ACCESS_COOKIE] as string | undefined;
  }

  if (!token) {
    return next(new ApiError(401, 'UNAUTHORIZED', 'Missing access token'));
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    req.auth = payload;
    return next();
  } catch {
    return next(new ApiError(401, 'UNAUTHORIZED', 'Invalid token'));
  }
}

export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  if (!req.auth) {
    return next(new ApiError(401, 'UNAUTHORIZED', 'Not authenticated'));
  }

  if (req.auth.type !== 'admin') {
    return next(new ApiError(403, 'FORBIDDEN', 'Admin access required'));
  }

  return next();
}