import 'server-only';
import { jwtVerify } from 'jose';
import type { UserRole } from '@/features/auth/domain/entities/user-role';

/**
 * Bearer-token authentication for the mobile API.
 * The app sends `Authorization: Bearer <jwt>` with the same signed token used
 * by the web session. Verifies it and returns the identity, or null.
 */
export interface ApiIdentity {
  userId: string;
  email: string;
  fullName: string;
  role: UserRole;
}

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_JWT_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error('AUTH_JWT_SECRET is missing or too short (min 16 chars).');
  }
  return new TextEncoder().encode(secret);
}

export async function authenticateRequest(request: Request): Promise<ApiIdentity | null> {
  const header = request.headers.get('authorization') ?? request.headers.get('Authorization');
  if (!header || !header.toLowerCase().startsWith('bearer ')) {
    return null;
  }
  const token = header.slice(7).trim();
  if (token.length === 0) {
    return null;
  }
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (!payload.sub || typeof payload.email !== 'string') {
      return null;
    }
    return {
      userId: payload.sub,
      email: payload.email as string,
      fullName: (payload.fullName as string) ?? (payload.email as string),
      role: payload.role as UserRole,
    };
  } catch {
    return null;
  }
}
