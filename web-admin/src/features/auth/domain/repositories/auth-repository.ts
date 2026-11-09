import type { Result } from '@/core/result';
import type { AuthUser } from '../entities/auth-user';

/**
 * Contract the presentation/application layers depend on. The concrete
 * implementation lives in the data layer (dependency inversion).
 */
export interface AuthRepository {
  signIn(email: string, password: string): Promise<Result<AuthUser>>;
  signOut(): Promise<Result<void>>;
  getCurrentUser(): Promise<Result<AuthUser | null>>;
}
