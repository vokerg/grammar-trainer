import { ApiErrorSchema, type ApiErrorResponse } from '@grammar/shared';
import type { z } from 'zod';

const baseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001';

export class ApiClientError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly payload?: ApiErrorResponse,
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

export async function apiRequest<T>(
  path: string,
  schema: z.ZodType<T>,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: { 'content-type': 'application/json', ...init?.headers },
  });
  if (response.status === 204) {
    return schema.parse(undefined);
  }
  const body: unknown = await response.json();
  if (!response.ok) {
    const parsed = ApiErrorSchema.safeParse(body);
    if (parsed.success) {
      throw new ApiClientError(parsed.data.error.code, parsed.data.error.message, parsed.data);
    }
    throw new ApiClientError('UNKNOWN_ERROR', 'Something went wrong. Please try again.');
  }
  return schema.parse(body);
}
