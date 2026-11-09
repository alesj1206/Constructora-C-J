import 'server-only';
import bcrypt from 'bcryptjs';
import { failure, success, type Result } from '@/core/result';
import { createSession, destroySession, readSession } from '@/lib/session';
import type { AuthUser } from '../../domain/entities/auth-user';
import { isUserRole } from '../../domain/entities/user-role';
import type { AuthRepository } from '../../domain/repositories/auth-repository';
import type { UserRow } from '../dtos/auth-user.dto';
import type { MysqlAuthDataSource } from '../datasources/mysql-auth.datasource';

/**
 * Implements the domain AuthRepository using MySQL + bcrypt + a JWT session
 * cookie. Maps rows to AuthUser and converts failures into typed Results.
 * Server-side only.
 */
export class AuthRepositoryImpl implements AuthRepository {
  constructor(private readonly dataSource: MysqlAuthDataSource) {}

  async signIn(email: string, password: string): Promise<Result<AuthUser>> {
    try {
      const row = await this.dataSource.findUserByEmail(email);
      if (!row) {
        // Do not reveal whether the email exists.
        return failure('INVALID_CREDENTIALS', 'No user for the given email.');
      }

      const passwordMatches = await bcrypt.compare(password, row.password_hash);
      if (!passwordMatches) {
        return failure('INVALID_CREDENTIALS', 'Password mismatch.');
      }

      const mapped = this.toAuthUser(row);
      if (!mapped.ok) {
        return mapped;
      }

      await createSession({
        sub: mapped.value.id,
        email: mapped.value.email,
        fullName: mapped.value.fullName,
        role: mapped.value.role,
      });
      return mapped;
    } catch (error) {
      return failure('UNKNOWN', toMessage(error));
    }
  }

  async signOut(): Promise<Result<void>> {
    try {
      await destroySession();
      return success(undefined);
    } catch (error) {
      return failure('UNKNOWN', toMessage(error));
    }
  }

  async getCurrentUser(): Promise<Result<AuthUser | null>> {
    try {
      const session = await readSession();
      if (!session) {
        return success(null);
      }

      // Re-check the database so a deactivated user loses access immediately.
      const row = await this.dataSource.findUserById(session.sub);
      if (!row) {
        return success(null);
      }
      return this.toAuthUser(row);
    } catch (error) {
      return failure('UNKNOWN', toMessage(error));
    }
  }

  private toAuthUser(row: UserRow): Result<AuthUser> {
    const isActive = row.is_active === true || row.is_active === 1;
    if (!isActive) {
      return failure('UNAUTHORIZED', 'User is not active.');
    }
    if (!isUserRole(row.role)) {
      return failure('UNAUTHORIZED', `Unknown or missing role for user ${row.id}.`);
    }
    return success({
      id: row.id,
      email: row.email,
      fullName: row.full_name,
      role: row.role,
    });
  }
}

function toMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unexpected error.';
}
