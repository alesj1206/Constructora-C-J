import { failure, type Result } from '@/core/result';
import type { AuthUser } from '../entities/auth-user';
import type { AuthRepository } from '../repositories/auth-repository';

/**
 * Signs a user in with email and password.
 * Performs minimal input validation, then delegates to the repository.
 * Pure: no React, no Supabase.
 */
export class SignIn {
  constructor(private readonly repository: AuthRepository) {}

  async execute(email: string, password: string): Promise<Result<AuthUser>> {
    const trimmedEmail = email.trim();

    if (trimmedEmail.length === 0 || password.length === 0) {
      return failure('INVALID_INPUT', 'Email and password are required.');
    }

    return this.repository.signIn(trimmedEmail, password);
  }
}
