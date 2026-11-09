/**
 * Minimal Result type used to carry success or failure across layers,
 * instead of throwing raw exceptions (see code-standards §6).
 */

export type Success<T> = { ok: true; value: T };
export type Failure = { ok: false; error: AppError };

export type Result<T> = Success<T> | Failure;

export type AppErrorCode = 'INVALID_INPUT' | 'INVALID_CREDENTIALS' | 'UNAUTHORIZED' | 'UNKNOWN';

export interface AppError {
  code: AppErrorCode;
  /** Technical message in English for logs; not shown to users directly. */
  message: string;
}

export function success<T>(value: T): Success<T> {
  return { ok: true, value };
}

export function failure(code: AppErrorCode, message: string): Failure {
  return { ok: false, error: { code, message } };
}
