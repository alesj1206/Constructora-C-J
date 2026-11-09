/**
 * Roles allowed in the admin web. Matches the `role` column in the
 * `profiles` table (see supabase/migrations). Pure domain, no dependencies.
 */
export type UserRole = 'manager' | 'site_engineer' | 'accountant' | 'warehouseman';

export const USER_ROLES: readonly UserRole[] = [
  'manager',
  'site_engineer',
  'accountant',
  'warehouseman',
];

export function isUserRole(value: unknown): value is UserRole {
  return typeof value === 'string' && (USER_ROLES as readonly string[]).includes(value);
}
