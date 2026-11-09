import { redirect } from 'next/navigation';
import { provideServerAuthRepository } from '@/core/di/auth.di.server';
import { GetCurrentUser } from '@/features/auth/domain/usecases/get-current-user';
import { LoginContainer } from '@/features/auth/presentation/containers/login-container';

// Reads the session cookie on every request; cannot be prerendered.
export const instant = false;

/**
 * Thin login route. Delegates rendering to LoginContainer.
 * If a session already exists, go straight to the inventory hub.
 */
export default async function LoginPage() {
  const getCurrentUser = new GetCurrentUser(provideServerAuthRepository());
  const result = await getCurrentUser.execute();
  if (result.ok && result.value) {
    redirect('/inventory');
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <LoginContainer />
    </main>
  );
}
