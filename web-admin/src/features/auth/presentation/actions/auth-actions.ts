'use server';

import type { AppErrorCode } from '@/core/result';
import { provideServerAuthRepository } from '@/core/di/auth.di.server';
import { SignIn } from '../../domain/usecases/sign-in';
import { SignOut } from '../../domain/usecases/sign-out';

/**
 * Server Actions exposed to Client Components. They run the use cases on the
 * server so bcrypt, MySQL and the session cookie stay server-side.
 */

export interface SignInActionResult {
  ok: boolean;
  errorCode?: AppErrorCode;
}

export async function signInAction(email: string, password: string): Promise<SignInActionResult> {
  const signIn = new SignIn(provideServerAuthRepository());
  const result = await signIn.execute(email, password);
  if (result.ok) {
    return { ok: true };
  }
  return { ok: false, errorCode: result.error.code };
}

export async function signOutAction(): Promise<void> {
  const signOut = new SignOut(provideServerAuthRepository());
  await signOut.execute();
}
