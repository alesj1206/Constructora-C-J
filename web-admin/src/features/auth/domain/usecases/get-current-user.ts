import type { Result } from '@/core/result';
import type { AuthUser } from '../entities/auth-user';
import type { AuthRepository } from '../repositories/auth-repository';

/**
 * Returns the currently authenticated user, or null when there is no session.
 * Used by the protected layout guard and the auth hook.
 */
export class GetCurrentUser {
  constructor(private readonly repository: AuthRepository) {}

  execute(): Promise<Result<AuthUser | null>> {
    return this.repository.getCurrentUser();
  }
}
