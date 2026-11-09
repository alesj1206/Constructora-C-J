/**
 * Shape of a row in the MySQL `users` table.
 * Lives in the data layer; mapped to the AuthUser entity by the repository.
 */
export interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  full_name: string;
  role: string;
  is_active: number | boolean;
}
