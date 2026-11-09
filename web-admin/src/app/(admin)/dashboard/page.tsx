import { provideServerAuthRepository } from '@/core/di/auth.di.server';
import { GetCurrentUser } from '@/features/auth/domain/usecases/get-current-user';

// Reads the session cookie on every request; cannot be prerendered.
export const instant = false;

/**
 * Placeholder landing page after login. Confirms the session is active and
 * shows the authenticated user. Real dashboard widgets come in later stories.
 */
export default async function DashboardPage() {
  const getCurrentUser = new GetCurrentUser(provideServerAuthRepository());
  const result = await getCurrentUser.execute();
  const user = result.ok ? result.value : null;

  return (
    <section className="flex flex-col gap-2">
      <h1 className="text-2xl font-semibold text-slate-900">Resumen</h1>
      {user ? (
        <p className="text-slate-600">
          Sesión activa como <span className="font-medium">{user.fullName}</span>.
        </p>
      ) : null}
      <p className="text-sm text-slate-500">
        Aquí se mostrarán el Kardex, las alertas de stock y los reportes.
      </p>
    </section>
  );
}
