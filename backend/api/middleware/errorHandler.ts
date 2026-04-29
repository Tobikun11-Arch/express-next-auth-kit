import {Request, Response, NextFunction} from 'express';
import {ApiError} from '../utils/error';
import {logger} from '../logging/logger';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      code: err.code,
      message: err.message,
      details: err.details
    });
  }

  logger.error({err}, 'Unhandled error');
  res.status(500).json({
    success: false,
    code: 'INTERNAL_ERROR',
    message: 'Unexpected error occurred',
    details: 'An unexpected error occurred'
  });
}