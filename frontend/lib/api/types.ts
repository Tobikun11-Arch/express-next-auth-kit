export type ApiErrorPayload = {
  success?: false;
  code?: string;
  message?: string;
  details?: unknown;
};

export type NormalizedApiError = {
  status: number | null;
  code: string;
  message: string;
  details?: unknown;
};
