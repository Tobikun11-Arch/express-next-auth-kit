import {Request, Response, NextFunction} from 'express';
import {logger} from '../logging/logger';

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();

  res.on('finish', () => {
    const durationMs = Date.now() - start;
    logger.info(
      {
        method: req.method,
        url: req.originalUrl,
        status: res.statusCode,
        durationMs
      },
      'request'
    );
  });

  next();
}
