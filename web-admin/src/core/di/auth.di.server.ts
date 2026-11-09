import 'server-only';
import { MysqlAuthDataSource } from '@/features/auth/data/datasources/mysql-auth.datasource';
import { AuthRepositoryImpl } from '@/features/auth/data/repositories/auth-repository.impl';
import type { AuthRepository } from '@/features/auth/domain/repositories/auth-repository';

/**
 * Server-side DI. Auth runs entirely on the server (MySQL + bcrypt + JWT
 * cookie). The `server-only` import guarantees this is never bundled for the
 * browser.
 */
export function provideServerAuthRepository(): AuthRepository {
  return new AuthRepositoryImpl(new MysqlAuthDataSource());
}
