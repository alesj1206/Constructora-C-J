import Link from 'next/link';
import { redirect } from 'next/navigation';
import { provideServerAuthRepository } from '@/core/di/auth.di.server';
import { GetCurrentUser } from '@/features/auth/domain/usecases/get-current-user';
import { sectionsForRole } from '@/features/auth/presentation/access/role-access';
import { SignOutButton } from '@/features/auth/presentation/components/sign-out-button';

// Reads the session cookie on every request; cannot be prerendered.
export const instant = false;

/**
 * Protected layout for all admin routes. Server-side guard:
 * - No session -> redirect to /login (AC3).
 * - Session -> renders a role-aware navigation menu (AC4).
 */
export default async function AdminLayout({ children }: LayoutProps<'/'>) {
  const getCurrentUser = new GetCurrentUser(provideServerAuthRepository());
  const result = await getCurrentUser.execute();

  if (!result.ok || !result.value) {
    redirect('/login');
  }

  const user = result.value;
  const sections = sectionsForRole(user.role);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3">
        <div className="flex items-center gap-6">
          <span className="font-semibold text-slate-900">Constructora C&amp;J</span>
          <nav className="flex gap-4">
            {sections.map((section) => (
              <Link
                key={section.key}
                href={section.href}
                className="text-sm text-slate-600 transition hover:text-slate-900"
              >
                {section.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-500">{user.fullName}</span>
          <SignOutButton />
        </div>
      </header>
      <main className="flex-1 px-6 py-8">{children}</main>
    </div>
  );
}
