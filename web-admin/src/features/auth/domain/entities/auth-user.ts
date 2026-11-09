import type { UserRole } from './user-role';

/**
 * Authenticated user as the application understands it.
 * Framework-free and serialization-free (pure domain entity).
 */
export interface AuthUser {
  readonly id: string;
  readonly email: string;
  readonly fullName: string;
  readonly role: UserRole;
}
