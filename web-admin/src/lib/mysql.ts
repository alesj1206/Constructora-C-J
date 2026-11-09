import 'server-only';
import mysql from 'mysql2/promise';

/**
 * Single MySQL connection pool for the whole app (server-side only).
 * Reads connection settings from environment variables.
 */

function readEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

declare global {
  // Reuse the pool across hot reloads in development.
  var __cjMysqlPool: mysql.Pool | undefined;
}

export function getPool(): mysql.Pool {
  if (!globalThis.__cjMysqlPool) {
    globalThis.__cjMysqlPool = mysql.createPool({
      host: readEnv('MYSQL_HOST'),
      port: Number(process.env.MYSQL_PORT ?? '3306'),
      user: readEnv('MYSQL_USER'),
      password: readEnv('MYSQL_PASSWORD'),
      database: readEnv('MYSQL_DATABASE'),
      waitForConnections: true,
      connectionLimit: 10,
      namedPlaceholders: false,
    });
  }
  return globalThis.__cjMysqlPool;
}
