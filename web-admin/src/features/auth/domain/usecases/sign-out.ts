import type { Result } from '@/core/result';
import type { AuthRepository } from '../repositories/auth-repository';

/**
 * Destroys the current session (logout). Pure: no React, no Supabase.
 */
export class SignOut {
  constructor(private readonly repository: AuthRepository) {}

  execute(): Promise<Result<void>> {
    return this.repository.signOut();
  }
}
