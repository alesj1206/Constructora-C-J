import type { AppErrorCode } from '@/core/result';

/**
 * All user-facing text for the auth feature, in Spanish, centralized here.
 * No Spanish literals should appear inline in components (code-standards §1).
 */
export const authStrings = {
  loginTitle: 'Iniciar sesión',
  loginSubtitle: 'Constructora C&J — Administración',
  emailLabel: 'Correo electrónico',
  passwordLabel: 'Contraseña',
  submitButton: 'Iniciar sesión',
  submitLoading: 'Ingresando...',
  signOutButton: 'Cerrar sesión',
  genericError: 'Ocurrió un error. Inténtalo de nuevo.',
  invalidCredentials: 'Correo o contraseña incorrectos.',
  unauthorized: 'Tu cuenta no tiene acceso autorizado.',
  accessDeniedTitle: 'Acceso denegado',
  accessDeniedBody: 'No tienes permiso para ver esta sección.',
} as const;

/** Maps a technical error code to a Spanish message shown to the user. */
export function errorMessageFor(code: AppErrorCode): string {
  switch (code) {
    case 'INVALID_CREDENTIALS':
      return authStrings.invalidCredentials;
    case 'UNAUTHORIZED':
      return authStrings.unauthorized;
    case 'INVALID_INPUT':
      return authStrings.invalidCredentials;
    default:
      return authStrings.genericError;
  }
}
