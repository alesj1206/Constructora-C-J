# Implementation — Login Web Admin
## Constructora C&J S.A.S.

<!--
How to build the "Login web admin" feature. Follows Clean Architecture (strict
frontend) from spec/code-standards.md §4, the stack from spec/tech-stack.md, and
the rules from spec/constitution.md. Companion to plan.md and validation.md.
-->

**Feature:** Autenticación Web de Administración (`HU-ADM-01`)
**Fecha:** 01-11-2026
**Estado:** Propuesta
**Specs base:** `spec/constitution.md`, `spec/tech-stack.md`, `spec/code-standards.md`

---

## 1. Principios aplicados

- **Code: English only.** Identificadores, archivos, carpetas y comentarios en
  inglés. Textos de usuario en **español**, centralizados (code-standards §1).
- **Clean Architecture estricta (frontend):** dependencias apuntan hacia adentro;
  `domain/` no importa React ni Supabase; solo el datasource importa
  `@supabase/supabase-js` (code-standards §4).
- **TypeScript `strict`**, sin `any` salvo justificado con comentario.
- **Sin unit tests.** Verificación manual en `validation.md` (code-standards §8).

## 2. Estructura de carpetas

```
src/
  core/
    di/
      auth.di.ts              # wires AuthRepositoryImpl -> AuthRepository
    result.ts                 # Result<T> / Either type
  lib/
    supabase-client.ts        # Supabase client from env vars (only init here)
  features/
    auth/
      domain/
        entities/
          auth-user.ts        # AuthUser { id, email, role }
          user-role.ts        # UserRole union/enum
        repositories/
          auth-repository.ts  # interface: signIn, signOut, getCurrentUser
        usecases/
          sign-in.ts          # SignIn
          sign-out.ts         # SignOut
          get-current-user.ts # GetCurrentUser
      data/
        dtos/
          auth-user.dto.ts    # shape returned by Supabase + profiles
        datasources/
          supabase-auth.datasource.ts   # ONLY file importing supabase-js
        repositories/
          auth-repository.impl.ts        # implements AuthRepository, maps DTO->entity
      presentation/
        components/
          login-form.tsx      # presentational: props + callbacks only
        containers/
          login-container.tsx # wires LoginForm to SignIn use case
        hooks/
          use-auth.ts         # exposes session + role to the UI
        strings/
          auth-strings.ts     # Spanish UI texts (centralized)
  app/
    login/
      page.tsx                # thin route -> renders <LoginContainer />
    (admin)/
      layout.tsx              # protected layout: guard session + role
      dashboard/
        page.tsx              # placeholder landing after login
supabase/
  migrations/
    0001_profiles.sql         # profiles table + RLS policies
```

## 3. Contratos del dominio (qué define cada pieza)

- **`user-role.ts`** — `type UserRole = 'manager' | 'site_engineer' | 'accountant' | 'warehouseman'`.
- **`auth-user.ts`** — entidad inmutable `AuthUser { id: string; email: string; role: UserRole; fullName: string }`. Sin dependencias de framework.
- **`auth-repository.ts`** — interfaz:
  - `signIn(email, password): Promise<Result<AuthUser>>`
  - `signOut(): Promise<Result<void>>`
  - `getCurrentUser(): Promise<Result<AuthUser | null>>`
- **Use cases** — orquestan el repositorio (inyectado), sin React ni Supabase:
  - `SignIn` → valida input mínimo y delega en `repo.signIn`.
  - `SignOut` → delega en `repo.signOut`.
  - `GetCurrentUser` → delega en `repo.getCurrentUser` (para el guard y el hook).

## 4. Capa de datos

- **`supabase-client.ts`** — inicializa el cliente con
  `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Único punto de
  inicialización.
- **`supabase-auth.datasource.ts`** — único archivo que importa `supabase-js`.
  Llama a `auth.signInWithPassword`, `auth.signOut`, `auth.getSession` y lee el
  `role` desde la tabla `profiles`.
- **`auth-repository.impl.ts`** — implementa `AuthRepository`, mapea DTO → `AuthUser`
  y convierte errores de Supabase en `Result` (no lanza excepciones a capas
  superiores).

## 5. Capa de presentación

- **`login-form.tsx`** — presentacional: recibe `onSubmit`, `loading`, `error`
  por props. Sin lógica de negocio, sin llamadas a datos. Textos desde
  `auth-strings.ts`.
- **`login-container.tsx`** — obtiene el use case vía DI, maneja estado de
  carga/error y llama a `SignIn`; en éxito redirige a `/dashboard`.
- **`use-auth.ts`** — expone `user`, `role`, `isAuthenticated`, `signOut` a la UI.
- **`auth-strings.ts`** — todos los textos en español:
  título, labels de email/contraseña, botón "Iniciar sesión", mensajes de error,
  "Cerrar sesión".

## 6. Rutas y guard

- **`app/login/page.tsx`** — ruta delgada; solo renderiza `<LoginContainer />`.
- **`app/(admin)/layout.tsx`** — layout protegido: usa `GetCurrentUser`; si no hay
  sesión, redirige a `/login`; si hay sesión, aplica gating por rol para el menú
  y las rutas.
- **`app/(admin)/dashboard/page.tsx`** — destino tras login (placeholder).
- **Logout** — botón en el layout que llama a `signOut` del hook y redirige a
  `/login`.

## 7. Base de datos (migración)

`supabase/migrations/0001_profiles.sql`:
- Tabla `profiles` (`snake_case`): `id uuid` (FK a `auth.users`), `full_name text`,
  `role text check (role in ('manager','site_engineer','accountant','warehouseman'))`,
  `is_active boolean default true`.
- **RLS habilitada**: un usuario lee su propia fila; escritura restringida a
  administración.

## 8. Pasos de implementación (orden)

1. **Scaffolding** del proyecto Next.js 16 + TypeScript `strict`, Tailwind, ESLint
   + Prettier (code-standards §7) — si el proyecto aún no existe.
2. **Supabase:** crear proyecto, habilitar Auth email/password, aplicar migración
   `0001_profiles.sql` con RLS.
3. **`lib/supabase-client.ts`** desde variables de entorno.
4. **Domain:** `user-role`, `auth-user`, `auth-repository`, use cases.
5. **Data:** `supabase-auth.datasource` + `auth-repository.impl` (mapeo y `Result`).
6. **DI:** `core/di/auth.di.ts` conecta implementación con interfaz.
7. **Presentation:** `auth-strings`, `use-auth`, `login-form`, `login-container`.
8. **Rutas:** `login/page`, layout protegido `(admin)/layout`, `dashboard/page`.
9. **Logout** y **gating por rol**.
10. **Verificación manual** según `validation.md`.

## 9. Variables de entorno

```
# .env.local  (NO se commitea)
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```
- Solo la anon key en el cliente. Ninguna llave de servicio en el frontend ni en
  el repo (constitución, seguridad).

## 10. Convenciones de Git (code-standards §9)

- Rama: `feature/hu-adm-01-login-web-admin`.
- Commits en inglés, imperativos: `feat: add supabase email/password sign-in`.
- Sin commits directos a `main`; integración vía rama + revisión.
- PR referencia `HU-ADM-01` e incluye el checklist de `validation.md`.
