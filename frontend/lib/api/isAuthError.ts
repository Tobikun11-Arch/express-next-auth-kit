import type {NormalizedApiError} from './types';

export function isAuthError(error: unknown): error is NormalizedApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    (error as NormalizedApiError).status === 401
  );
}
