import 'server-only';
import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import type { UserRole } from '@/features/auth/domain/entities/user-role';

/**
 * Session handling with a signed, HTTP-only JWT cookie (no session table).
 * Replaces Supabase sessions. Server-side only.
 */

const COOKIE_NAME = 'cj_session';
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8; // 8 hours

export interface SessionPayload {
  sub: string; // user id
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

export async function createSession(payload: SessionPayload): Promise<void> {
  const token = await new SignJWT({
    email: payload.email,
    fullName: payload.fullName,
    role: payload.role,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(getSecret());

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function readSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) {
    return null;
  }
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (!payload.sub || typeof payload.email !== 'string') {
      return null;
    }
    return {
      sub: payload.sub,
      email: payload.email as string,
      fullName: payload.fullName as string,
      role: payload.role as UserRole,
    };
  } catch {
    return null;
  }
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
