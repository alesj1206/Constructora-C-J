# Plan — Login Web Admin
## Constructora C&J S.A.S.

<!--
Plan for TODO item #1: "Login web admin".
Grounded in spec/constitution.md, spec/tech-stack.md, spec/code-standards.md.
Scope: authentication for the Next.js admin web only. The Flutter mobile app
login is a separate effort.
-->

**Feature:** Autenticación y acceso a la Web de Administración
**Fecha:** 01-11-2026
**Estado:** Propuesta
**Fuente:** `TODO.md` → "1. Login web admin"
**Specs base:** `spec/constitution.md`, `spec/tech-stack.md`, `spec/code-standards.md`

---

## 1. Objetivo

Permitir que el personal autorizado de Constructora C&J inicie sesión de forma
segura en la **web de administración** (Next.js) y acceda, según su rol, a las
secciones permitidas. La sesión protege el acceso al Kardex, los reportes y la
configuración.

Es el primer feature porque habilita todas las demás pantallas admin (dashboard,
semáforo PP/SS, reportes, exportación a Excel).

## 2. Alcance

### Dentro
- Inicio de sesión con **email + contraseña** usando **Supabase Auth**.
- **Protección de rutas:** solo usuarios autenticados entran al área admin.
- **Control de acceso por rol** (RBAC): menú y rutas según el rol.
- **Cerrar sesión** (logout) y **persistencia de sesión** entre recargas.
- Estados de UI: cargando, error de credenciales, sesión expirada.
- UI en **español**; código en **inglés** (code-standards §1).

### Fuera (iteraciones posteriores)
- Auto-registro público de usuarios (los crea un administrador).
- Login de la app móvil (Flutter).
- Proveedores externos (Google, etc.) y MFA.
- Recuperación de contraseña (marcada como mejora opcional).

## 3. Historia de usuario y criterios de aceptación

> No está en el backlog original (HU-00…HU-07). Se propone como **HU-ADM-01** por
> ser habilitadora del resto de la web admin.

**HU-ADM-01 — Inicio de sesión en la web de administración**
- **Como** usuario autorizado (gerente, residente, contador o almacenista),
- **quiero** iniciar sesión con mi correo y contraseña,
- **para** acceder de forma segura a la información de inventario y reportes según
  mi rol.

**Criterios de aceptación (Given/When/Then):**
1. **Login correcto.** Dado un usuario registrado con credenciales válidas, cuando
   ingresa email y contraseña correctos y envía el formulario, entonces el sistema
   crea la sesión y lo redirige al dashboard admin.
2. **Login incorrecto.** Dado un usuario con credenciales inválidas, cuando envía
   el formulario, entonces el sistema muestra "Correo o contraseña incorrectos" en
   español y **no** crea la sesión.
3. **Ruta protegida.** Dado un usuario **no** autenticado, cuando intenta abrir
   cualquier ruta del área admin, entonces es redirigido al login.
4. **Acceso por rol.** Dado un usuario autenticado con un rol, cuando navega,
   entonces solo ve y entra a las secciones permitidas para su rol; una ruta no
   permitida se niega.
5. **Persistencia de sesión.** Dado un usuario con sesión activa, cuando recarga o
   vuelve (dentro de la vigencia del token), entonces sigue autenticado.
6. **Cerrar sesión.** Dado un usuario autenticado, cuando pulsa "Cerrar sesión",
   entonces la sesión se destruye y es redirigido al login.

## 4. Enfoque técnico (resumen)

- **Stack:** Next.js 16 + React + TypeScript `strict`, Tailwind, `@supabase/supabase-js`
  (tech-stack §5).
- **Arquitectura:** Clean Architecture **estricta** en el frontend
  (code-standards §4). El feature vive en `src/features/auth/`.
- **Auth:** Supabase Auth (email/contraseña). No almacenamos contraseñas propias.
- **Roles:** tabla `profiles` con `role` ∈ { `manager`, `site_engineer`,
  `accountant`, `warehouseman` } y RLS habilitada.
- El detalle de capas, archivos y pasos está en `implementation.md`.

## 5. Datos y seguridad

- Supabase gestiona hash de contraseñas y tokens de sesión.
- `profiles` (`snake_case`): `id` (FK a `auth.users`), `full_name`, `role`,
  `is_active`. RLS activa en `profiles` y en todas las tablas de datos
  (constitución Art. V).
- Usuarios creados por un administrador (sin registro público).
- Secretos en `.env.local` (no se commitea). Nunca se exponen llaves de servicio
  en el cliente.

## 6. Riesgos y decisiones abiertas

- **¿El almacenista entra a la web admin?** Opera sobre todo desde el móvil, pero
  puede necesitar acceso para conciliación. Pendiente de confirmar.
- **Gestión de usuarios:** ¿pantalla de alta de usuarios en esta fase o creación
  manual por un admin en Supabase?
- **Recuperación de contraseña:** ¿en esta iteración o después?
- **¿Existe ya el proyecto Next.js** en el repo o se crea desde cero?

## 7. Entregables de esta spec

- `plan.md` — este documento (qué y por qué).
- `implementation.md` — cómo (estructura, pasos, código a crear).
- `validation.md` — verificación manual contra criterios (sin unit tests).

## 8. Definición de Done (code-standards §10)

1. Clean Architecture estricta en el frontend.
2. Los 6 criterios de aceptación verificados manualmente y pasando.
3. Formato + lint pasan; el build compila limpio.
4. Código en inglés; textos de usuario en español y centralizados.
5. Sin secretos en el repo; RLS habilitada en Supabase.
6. Integrado vía rama + revisión, referenciando `HU-ADM-01`.
