import type { Context } from 'hono';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public fieldErrors?: Record<string, string[]>
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, fieldErrors?: Record<string, string[]>) {
    super(400, 'VALIDATION', message, fieldErrors);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(401, 'UNAUTHORIZED', message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(403, 'FORBIDDEN', message);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Not found') {
    super(404, 'NOT_FOUND', message);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(409, 'CONFLICT', message);
  }
}

export class RateLimitError extends AppError {
  constructor(retryAfterSec: number) {
    super(429, 'RATE_LIMIT', 'Rate limit exceeded', { retryAfterSec: [retryAfterSec.toString()] });
  }
}

export function handleError(error: Error, c: Context) {
  console.error('API Error:', error);

  if (error instanceof AppError) {
    return c.json({
      code: error.code,
      message: error.message,
      ...(error.fieldErrors && { fieldErrors: error.fieldErrors })
    }, error.statusCode);
  }

  // Database constraint errors
  if (error.message.includes('UNIQUE constraint failed')) {
    return c.json({
      code: 'CONFLICT',
      message: 'Resource already exists'
    }, 409);
  }

  // Default server error
  return c.json({
    code: 'INTERNAL_ERROR',
    message: 'An unexpected error occurred'
  }, 500);
}