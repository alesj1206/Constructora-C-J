'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { signInAction } from '../actions/auth-actions';
import { LoginForm } from '../components/login-form';
import { authStrings, errorMessageFor } from '../strings/auth-strings';

/**
 * Wires the presentational LoginForm to the signIn server action.
 * Handles loading/error state and redirects to the dashboard on success (AC1).
 *
 * Uses useTransition so the pending flag is bound to the transition itself and
 * is cleared automatically when it finishes. This avoids a stale `loading`
 * state leaving the submit button disabled when the component is reused across
 * Next.js soft navigation (e.g. returning to /login after logout).
 */
export function LoginContainer() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function handleSubmit(email: string, password: string) {
    setErrorMessage(null);
    startTransition(async () => {
      const result = await signInAction(email, password);
      if (result.ok) {
        router.replace('/inventory');
        router.refresh();
        return;
      }
      setErrorMessage(errorMessageFor(result.errorCode ?? 'UNKNOWN'));
    });
  }

  return (
    <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
      <div className="mb-6 flex flex-col gap-1">
        <h1 className="text-xl font-semibold text-slate-900">{authStrings.loginTitle}</h1>
        <p className="text-sm text-slate-500">{authStrings.loginSubtitle}</p>
      </div>
      <LoginForm onSubmit={handleSubmit} loading={isPending} errorMessage={errorMessage} />
    </div>
  );
}
