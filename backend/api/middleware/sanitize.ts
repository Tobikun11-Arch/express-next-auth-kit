import {Request, Response, NextFunction} from 'express';

function sanitizeObject(obj: any) {
  if (!obj || typeof obj !== 'object') {
    return;
  }

  for (const key of Object.keys(obj)) {
    if (key.startsWith('$')) {
      delete obj[key];
      continue;
    }

    sanitizeObject(obj[key]);
  }
}

// I sanitize request payloads to reduce injection risks
export function sanitize(req: Request, _res: Response, next: NextFunction) {
  sanitizeObject(req.body);
  sanitizeObject(req.query);
  sanitizeObject(req.params);
  next();
}