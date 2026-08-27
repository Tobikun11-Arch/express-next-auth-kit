import {Request, Response, NextFunction} from 'express';
import {env} from '../config/env';

export function httpsRedirect(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (env.NODE_ENV !== 'production') {
    return next();
  }

  const proto = req.headers['x-forwarded-proto'];
  const isSecure =
    req.secure ||
    (typeof proto === 'string' && proto.split(',')[0].trim() === 'https');

  if (isSecure) {
    return next();
  }

  const host = req.headers.host;
  return res.redirect(301, `https://${host}${req.originalUrl}`);
}
