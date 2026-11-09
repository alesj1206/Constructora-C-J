import 'server-only';
import type { RowDataPacket } from 'mysql2';
import { getPool } from '@/lib/mysql';
import type { UserRow } from '../dtos/auth-user.dto';

/**
 * The only module in the auth feature that talks to MySQL.
 * Returns raw rows; hashing checks and mapping happen in the repository.
 */
export class MysqlAuthDataSource {
  async findUserByEmail(email: string): Promise<UserRow | null> {
    const pool = getPool();
    const [rows] = await pool.query<(UserRow & RowDataPacket)[]>(
      'SELECT id, email, password_hash, full_name, role, is_active FROM users WHERE email = ? LIMIT 1',
      [email],
    );
    return rows.length > 0 ? rows[0] : null;
  }

  async findUserById(id: string): Promise<UserRow | null> {
    const pool = getPool();
    const [rows] = await pool.query<(UserRow & RowDataPacket)[]>(
      'SELECT id, email, password_hash, full_name, role, is_active FROM users WHERE id = ? LIMIT 1',
      [id],
    );
    return rows.length > 0 ? rows[0] : null;
  }
}
