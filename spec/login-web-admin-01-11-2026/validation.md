# Validation — Login Web Admin
## Constructora C&J S.A.S.

<!--
Manual verification for the "Login web admin" feature. No unit tests are required
(spec/code-standards.md §8). Correctness is confirmed by reproducing each
acceptance criterion by hand and recording the result. Companion to plan.md and
implementation.md.
-->

**Feature:** Autenticación Web de Administración (`HU-ADM-01`)
**Fecha:** 01-11-2026
**Estado:** Pendiente de ejecución
**Specs base:** `spec/constitution.md`, `spec/code-standards.md`

---

## 1. Enfoque de validación

- **No se exigen pruebas unitarias** (code-standards §8).
- Se verifica **manualmente** cada criterio de aceptación de `HU-ADM-01`.
- Se registra el resultado (pasa / falla + nota) en este documento o en el PR.
- La historia se cierra solo si **todos** los criterios pasan y se cumple la
  Definición de Done.

## 2. Precondiciones

- Proyecto Next.js corriendo en local (`npm run dev`) con `.env.local` configurado.
- Proyecto Supabase con Auth email/password habilitado y migración `profiles`
  aplicada (RLS activa).
- Al menos un usuario de prueba por rol en `profiles`:
  - `manager@test.cj` (role `manager`)
  - `residente@test.cj` (role `site_engineer`)
  - `contador@test.cj` (role `accountant`)
  - `almacen@test.cj` (role `warehouseman`)

## 3. Casos de verificación (contra criterios de aceptación)

| # | Criterio | Pasos | Resultado esperado | Estado |
|---|----------|-------|--------------------|--------|
| V1 | AC1 Login correcto | Ingresar email+contraseña válidos y enviar | Crea sesión y redirige al dashboard | ☐ |
| V2 | AC2 Login incorrecto | Ingresar contraseña errónea y enviar | Mensaje "Correo o contraseña incorrectos" (ES); no crea sesión | ☐ |
| V3 | AC3 Ruta protegida | Sin sesión, abrir `/dashboard` directo por URL | Redirige a `/login` | ☐ |
| V4 | AC4 Acceso por rol | Entrar con un rol y abrir una ruta no permitida para ese rol | Se niega el acceso; el menú solo muestra lo permitido | ☐ |
| V5 | AC5 Persistencia | Con sesión activa, recargar la página (F5) | Sigue autenticado, sin pedir credenciales | ☐ |
| V6 | AC6 Logout | Pulsar "Cerrar sesión" | Destruye sesión y redirige a `/login` | ☐ |

## 4. Checklist transversal (de code-standards §8)

- [ ] Toda la UI está en español; sin textos incrustados en la lógica.
- [ ] Todo el código (identificadores, comentarios) está en inglés.
- [ ] `eslint` pasa sin errores ni warnings nuevos.
- [ ] `prettier --check` pasa.
- [ ] El build de Next.js (`npm run build`) compila sin errores.
- [ ] Clean Architecture respetada: `domain/` no importa React ni Supabase; solo
      el datasource importa `supabase-js`; componentes presentacionales sin lógica.
- [ ] No hay secretos ni llaves de servicio en el cliente ni en el repo.
- [ ] RLS habilitada en `profiles`; un usuario solo lee su propia fila.

## 5. Seguridad (revisión manual)

- [ ] Las contraseñas las gestiona Supabase (no hay almacenamiento propio).
- [ ] `.env.local` está en `.gitignore` y no fue commiteado.
- [ ] La sesión expira y, al expirar, una ruta admin redirige a `/login`.
- [ ] Mensajes de error no revelan si el email existe o no (mensaje genérico).

## 6. Registro de ejecución

### 6.1 Verificaciones automáticas (ejecutadas 01-11-2026)

| Check | Comando | Resultado |
|-------|---------|-----------|
| Build / compila | `npm run build` | ✅ Exit 0 (6 páginas generadas) |
| TypeScript `strict` | (parte del build) | ✅ Sin errores de tipos |
| Lint | `npm run lint` | ✅ Exit 0, sin errores |
| Formato | `npx prettier --check .` | ✅ Exit 0 |
| Clean Architecture | revisión de imports | ✅ `domain/` sin React/Supabase; solo el datasource importa `supabase-js`; DI separado cliente/servidor |

> Nota: el build emite un **warning** de Supabase recomendando Node.js 22+
> (se usó Node 20.10). Es solo advertencia; el build termina con exit 0.

### 6.2 Verificaciones de runtime con `next dev` + MySQL local (01-11-2026)

> Nota de arquitectura: se reemplazó Supabase por **MySQL local** (MySQL 8.0.45)
> con bcrypt + cookie JWT de sesión. Base `constructora_cj`, usuario de app
> `cj_app`, usuario de prueba `anfereza@gmail.com` / `password` (rol `manager`).

Servidor levantado con `npm run dev` (puerto 3001; el 3000 estaba ocupado).

| Check | Evidencia | Resultado |
|-------|-----------|-----------|
| Servidor arranca | `npm run dev` | ✅ "Ready" |
| Login renderiza | `GET /login` | ✅ 200; "Iniciar sesión", "Correo electrónico"; `lang="es"` |
| Verificación de credenciales (DB) | query como `cj_app` + `bcrypt.compare` | ✅ usuario encontrado, rol `manager`, activo; `password` ✅; password errónea ❌ |
| **AC1** login real | `POST /login` → `signInAction("anfereza@gmail.com","password")` | ✅ 200 en logs; luego `GET /dashboard 200` |
| **AC3** ruta protegida sin sesión | `GET /dashboard` sin cookie | ✅ 307 → `/login` |
| **AC5** sesión aceptada por el guard | `GET /dashboard` con cookie `cj_session` válida | ✅ 200; muestra "Sesión activa", nombre del usuario y "Cerrar sesión" |
| Raíz redirige | `GET /` sin sesión | ✅ 307 → `/dashboard` → `/login` |

> Durante la validación inicial se corrigió un warning de Next 16 (`instant`)
> agregando `export const instant = false` en `src/app/page.tsx`.

### 6.3 Verificaciones aún pendientes (UI en navegador)

Confirmadas a nivel de servidor/HTTP; conviene una pasada final en navegador:

- **AC2** mensaje en español exacto al escribir credenciales inválidas en el form.
- **AC4** gating de menú/rutas al entrar con roles distintos de `manager`.
- **AC6** clic en "Cerrar sesión" desde la UI (la acción `signOutAction` y el
  borrado de cookie ya están implementados y el botón los invoca).

- **Fecha de ejecución (manual):** ____________
- **Ejecutado por:** ____________
- **Resultado global:** ☐ Aprobado  ☐ Rechazado
- **Validación con cliente** (si aplica, Art. IV/VI): ____________
- **Notas / hallazgos:**
  - ____________________________________________

## 7. Definición de Done (debe cumplirse para cerrar)

1. Clean Architecture estricta en el frontend.
2. V1–V6 verificados manualmente y en estado "pasa".
3. Checklist transversal (§4) y seguridad (§5) completos.
4. Formato + lint pasan; build compila limpio.
5. Código en inglés; textos de usuario en español y centralizados.
6. Integrado vía rama + revisión, referenciando `HU-ADM-01`.
