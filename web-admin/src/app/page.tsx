import { redirect } from 'next/navigation';

// Redirects on every request; cannot be prerendered.
export const instant = false;

/**
 * Root route sends users to the inventory hub (MVP landing); the protected
 * (admin) layout redirects unauthenticated users to /login (AC3).
 */
export default function Home() {
  redirect('/inventory');
}
